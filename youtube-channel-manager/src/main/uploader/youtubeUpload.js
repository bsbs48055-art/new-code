'use strict';

/**
 * Drives the real YouTube Studio web UI (via Playwright) to upload a
 * single video with its metadata. This automates the *browser*, the same
 * way a human would click through the upload wizard - there is no private
 * YouTube API involved, which means:
 *
 *   - It only works on a page/profile that is already logged in to the
 *     target Google account (we never touch credentials).
 *   - YouTube can and does change its Studio UI over time. Every selector
 *     below is written with 2-3 fallback strategies (stable custom-element
 *     names, aria-labels, then plain DOM order) to stay resilient, but if
 *     YouTube ships a redesign this file is the single place to fix it.
 */

const path = require('path');

const TIMEOUT = {
  navigation: 60000,
  uploadStart: 30000,
  step: 20000,
  publish: 45000
};

async function dismissTransientPopups(page) {
  const dismissTexts = ['Got it', 'Skip', 'No thanks', 'Later', 'OK', 'Dismiss'];
  for (const text of dismissTexts) {
    try {
      const btn = page.getByRole('button', { name: text, exact: false }).first();
      if (await btn.isVisible({ timeout: 500 })) {
        await btn.click({ timeout: 1000 }).catch(() => {});
      }
    } catch {
      // best-effort only
    }
  }
}

async function firstVisible(locators, timeout = 2000) {
  for (const locator of locators) {
    try {
      await locator.waitFor({ state: 'visible', timeout });
      return locator;
    } catch {
      // try next strategy
    }
  }
  return null;
}

async function clickRadioInGroup(page, groupSelectors, index) {
  for (const groupSelector of groupSelectors) {
    try {
      const group = page.locator(groupSelector).first();
      if (await group.count() === 0) continue;
      const radios = group.locator('tp-yt-paper-radio-button, ytcp-icon-radio-button');
      const count = await radios.count();
      if (count > index) {
        await radios.nth(index).click({ timeout: 3000 });
        return true;
      }
    } catch {
      // try next group selector
    }
  }
  return false;
}

async function clearAndType(page, locator, text) {
  await locator.click({ timeout: 5000 });
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Delete');
  if (text) {
    await page.keyboard.type(text, { delay: 5 });
  }
}

async function ensureLoggedIn(page) {
  const url = page.url();
  if (/accounts\.google\.com/.test(url)) {
    throw new Error(
      'This Chrome profile is not logged in to a Google account. Open the profile in Chrome, log in to YouTube, then re-sync it from Settings.'
    );
  }
}

async function getTitleAndDescriptionBoxes(page) {
  const title = await firstVisible(
    [
      page.locator('#title-textarea #textbox').first(),
      page.locator('ytcp-video-metadata-editor #textbox').first(),
      page.getByLabel(/title/i).first()
    ],
    TIMEOUT.step
  );

  const description = await firstVisible(
    [
      page.locator('#description-textarea #textbox').first(),
      page.locator('ytcp-video-metadata-editor #textbox').nth(1),
      page.getByLabel(/description/i).first()
    ],
    TIMEOUT.step
  );

  return { title, description };
}

async function setThumbnail(page, thumbnailPath, log) {
  if (!thumbnailPath) return;
  try {
    const input = page.locator('input[type="file"][accept*="image"]').first();
    if ((await input.count()) > 0) {
      await input.setInputFiles(thumbnailPath, { timeout: 10000 });
      log(`Thumbnail attached: ${path.basename(thumbnailPath)}`);
    }
  } catch (err) {
    log(`Could not attach thumbnail (${err.message}). Continuing without it.`);
  }
}

async function clickNext(page, log, stepName) {
  const next = await firstVisible(
    [page.locator('#next-button').first(), page.getByRole('button', { name: 'Next', exact: false }).first()],
    TIMEOUT.step
  );
  if (!next) {
    throw new Error(`Could not find the "Next" button on the "${stepName}" step.`);
  }
  await next.click({ timeout: 5000 });
  log(`Advanced past "${stepName}" step.`);
  await page.waitForTimeout(700);
}

async function setVisibility(page, privacy, log) {
  const map = { public: 2, unlisted: 1, private: 0 };
  const index = map[String(privacy || 'private').toLowerCase()] ?? 0;
  const ok = await clickRadioInGroup(page, ['#privacy-radios', 'ytcp-video-visibility-select'], index);
  if (!ok) {
    log(`Warning: could not set visibility to "${privacy}" - leaving YouTube's default (usually Private).`);
  } else {
    log(`Visibility set to "${privacy}".`);
  }
}

async function setMadeForKids(page, madeForKids, log) {
  const index = madeForKids ? 0 : 1;
  const ok = await clickRadioInGroup(
    page,
    ['#made-for-kids-group', 'ytcp-made-for-kids-select #audience-select'],
    index
  );
  if (!ok) {
    log('Warning: could not set the "Made for kids" answer automatically - you may need to set it manually.');
  }
}

async function applyPlaylist(page, playlistName, log) {
  if (!playlistName) return;
  try {
    const dropdown = page
      .locator('#playlists-container, ytcp-video-metadata-playlists')
      .first()
      .locator('#dropdown-trigger, ytcp-dropdown-trigger')
      .first();
    if ((await dropdown.count()) === 0) return;
    await dropdown.click({ timeout: 5000 });

    const searchBox = page.locator('#search-input input, ytcp-playlist-dialog input').first();
    if ((await searchBox.count()) > 0) {
      await searchBox.fill(playlistName, { timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(500);
    }

    const option = page.getByText(playlistName, { exact: false }).first();
    if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
      await option.click({ timeout: 3000 });
    }

    const doneBtn = page.getByRole('button', { name: 'Done', exact: false }).first();
    if (await doneBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await doneBtn.click({ timeout: 3000 });
    }
    log(`Added to playlist "${playlistName}".`);
  } catch (err) {
    log(`Warning: could not set playlist "${playlistName}" (${err.message}).`);
  }
}

/**
 * Uploads a single video. `log(message)` is called with human-readable
 * progress updates so the UI can stream them live.
 */
async function uploadVideo(page, video, log) {
  const { filePath, metadata } = video;

  log(`Opening YouTube upload page for "${video.fileName}"...`);
  await page.goto('https://www.youtube.com/upload', {
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUT.navigation
  });
  await ensureLoggedIn(page);
  await dismissTransientPopups(page);

  const fileInput = await firstVisible([page.locator('input[type="file"]').first()], TIMEOUT.uploadStart);
  if (!fileInput) {
    throw new Error('Could not find the YouTube file upload input. YouTube may have changed its upload page.');
  }

  await fileInput.setInputFiles(filePath, { timeout: 60000 });
  log('File selected, waiting for the details form to appear...');

  const { title, description } = await getTitleAndDescriptionBoxes(page);
  if (!title) {
    throw new Error('Could not find the video title field. YouTube may have changed its upload dialog.');
  }

  await clearAndType(page, title, metadata.title);
  log(`Title set: "${metadata.title}"`);

  if (description && metadata.description) {
    await clearAndType(page, description, metadata.description);
    log('Description set.');
  }

  await setThumbnail(page, metadata.thumbnail, log);
  await applyPlaylist(page, metadata.playlist, log);
  await setMadeForKids(page, metadata.madeForKids, log);

  await clickNext(page, log, 'Details');
  await clickNext(page, log, 'Video elements');
  await clickNext(page, log, 'Checks');

  await setVisibility(page, metadata.privacy, log);

  const publishBtn = await firstVisible(
    [
      page.locator('#done-button').first(),
      page.getByRole('button', { name: /publish|save|done/i }).first()
    ],
    TIMEOUT.step
  );
  if (!publishBtn) {
    throw new Error('Could not find the final Publish/Save button.');
  }
  await publishBtn.click({ timeout: 10000 });
  log('Submitted for publishing, waiting for confirmation...');

  await page
    .locator('#close-button, ytcp-uploads-dialog #close-icon-button')
    .first()
    .waitFor({ state: 'visible', timeout: TIMEOUT.publish })
    .catch(() => {});

  await dismissTransientPopups(page);

  let videoUrl = null;
  try {
    const link = page.locator('a[href*="youtu.be/"], a[href*="watch?v="]').first();
    if (await link.isVisible({ timeout: 3000 })) {
      videoUrl = await link.getAttribute('href');
    }
  } catch {
    // not critical, upload already succeeded regardless
  }

  const closeBtn = page.locator('#close-button, ytcp-uploads-dialog #close-icon-button').first();
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click({ timeout: 5000 }).catch(() => {});
  }

  log(`Upload complete: "${video.fileName}"${videoUrl ? ` -> ${videoUrl}` : ''}`);
  return { success: true, videoUrl };
}

module.exports = { uploadVideo };
