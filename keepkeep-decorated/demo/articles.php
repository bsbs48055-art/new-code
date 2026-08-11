<?php
/**
 * Preview articles.
 *
 * Written for this theme so the layouts can be judged with real prose — genuine
 * practical advice, not lorem ipsum and not scraped from anywhere. They exist to
 * demonstrate the templates.
 *
 * Replace them with your own work before launch. Fourteen demo posts are not a
 * publication, and Google's guidance on helpful content is unambiguous that
 * originality and usefulness are what count.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Article definitions.
 *
 * @return array<int,array<string,mixed>>
 */
function kkd_demo_articles() {
	return array(

		/* ------------------------------------------------------------ Decor */
		array(
			'title'    => 'How to Make a Living Room Feel Warmer Without Redecorating',
			'slug'     => 'make-living-room-feel-warmer',
			'category' => 'decor',
			'tags'     => array( 'living room', 'lighting', 'textiles', 'budget-friendly' ),
			'image'    => 'kkd-living-room.jpg',
			'alt'      => 'Illustration of a sofa in an arched alcove with a floor lamp, low table and round rug',
			'excerpt'  => 'A cold-feeling living room is usually a lighting and texture problem rather than a colour problem. Here is the order to tackle it in, and what to change first.',
			'content'  => '
<p>Rooms that feel cold rarely have anything to do with the thermostat. A living room can be perfectly decorated and still feel unwelcoming, and when that happens the instinct is to repaint. Almost always, the problem is somewhere else: light that comes from the wrong height, surfaces that all have the same finish, and furniture pushed flat against the walls.</p>
<p>Here is the order we would work through, cheapest and most reversible first.</p>

<h2>Start with the height of your light</h2>
<p>A single ceiling fixture lights a room the way a car park is lit: evenly, from above, with no shadow to give anything shape. Every room reads warmer with light at two or three different heights, and you rarely need more total brightness — just more sources at lower levels.</p>
<p>The practical version of that rule:</p>
<ul>
<li>One light at reading height, beside wherever people actually sit.</li>
<li>One light at table height, on a sideboard, shelf or console.</li>
<li>The ceiling light on a dimmer, used at 40&ndash;60% in the evening, or switched off entirely once the others are on.</li>
</ul>
<p>If you rent, or you would rather not add fittings, plug-in wall lights and rechargeable table lamps both work. The change is immediate.</p>

<h3>Get the bulb temperature right</h3>
<p>Bulb colour is measured in kelvin, and the number is printed on the box. For living rooms, 2700K reads as warm and domestic. 3000K is slightly crisper and works well where you also read or work. Anything at 4000K or above will make a beautifully painted room look like a waiting area, no matter what colour the walls are.</p>
<p>The other thing worth checking is CRI &mdash; colour rendering index. Above 90 means colours look like themselves. Cheap bulbs often sit around 80, which quietly drains the warmth out of terracotta, wood and anything with a red note in it.</p>

<h2>Break up matte surfaces with texture</h2>
<p>A room where the walls, sofa, curtains and rug all have a similar flat finish will feel hard, even in warm colours. Warmth comes from a mix of surfaces that catch light differently. You do not need more objects &mdash; you need more variety in what you already have.</p>
<p>Look for a way to introduce each of these:</p>
<ul>
<li><strong>Something woven:</strong> a jute or wool rug, a basket, a throw with visible weave.</li>
<li><strong>Something soft with weight:</strong> a heavier curtain, a linen cushion cover that creases rather than staying crisp.</li>
<li><strong>Something reflective, but small:</strong> a mirror, a glazed vase, a brass lamp base. One or two only, or the effect flips to cold.</li>
<li><strong>Something with grain:</strong> a wooden bowl, a stool, an unpainted frame.</li>
</ul>

<h2>Pull the furniture off the walls</h2>
<p>Pushing everything back against the skirting boards is the most common reason a large room feels like a corridor. Even five centimetres of breathing space behind a sofa changes how the room reads, because the eye stops treating the furniture as part of the wall.</p>
<p>Two arrangement checks that reliably help:</p>
<ul>
<li>Seats should be able to see each other. If two chairs both face a television and neither faces the other, the room will feel like a departure lounge.</li>
<li>Every seat needs a surface within arm&rsquo;s reach for a cup. This is the single most-missed detail in otherwise handsome rooms.</li>
</ul>

<h2>Fix the rug size before buying anything else</h2>
<p>An undersized rug makes furniture look like it is floating. As a rule of thumb, the front legs of every main seat should sit on the rug. In a typical living room that means the rug is wider than the sofa on both sides, not narrower.</p>
<p>If a correctly sized rug is out of budget for now, it is better to have no rug than a small one. A bare floor reads as a deliberate choice; a small rug reads as a mistake.</p>

<h2>Then, and only then, consider paint</h2>
<p>If you have done all of the above and the room still feels cold, the wall colour may genuinely be the problem &mdash; particularly if it is a grey or white with a blue undertone in a room that gets north light. Before committing, paint a large test patch, at least A2 size, and look at it in the evening under the lamps you actually use rather than at midday.</p>

<h2>A realistic order of work</h2>
<ol>
<li>Swap the bulbs. An afternoon, very little money.</li>
<li>Add one lamp at reading height. Immediate, reversible.</li>
<li>Move the furniture. Free.</li>
<li>Introduce two or three textures from what you own.</li>
<li>Get the rug size right.</li>
<li>Reassess the paint.</li>
</ol>
<p>Most rooms stop feeling cold somewhere around step three.</p>
',
		),

		array(
			'title'    => 'Small Bedroom Decorating Ideas That Actually Free Up Space',
			'slug'     => 'small-bedroom-decorating-ideas',
			'category' => 'decor',
			'tags'     => array( 'bedroom', 'small space ideas', 'storage' ),
			'image'    => 'kkd-small-bedroom.jpg',
			'alt'      => 'Illustration of a window with curtains and a soft pool of light on the floor',
			'excerpt'  => 'Most small-bedroom advice is really about making a room look bigger in photographs. These changes give you back usable floor and surface space.',
			'content'  => '
<p>There is a difference between a bedroom that photographs as spacious and one that feels spacious to live in. The first needs pale colours and a wide-angle lens. The second needs floor you can walk on, a surface to put a glass of water down on, and somewhere for clothes that are neither clean nor dirty.</p>

<h2>Reclaim the floor first</h2>
<p>In a small room, floor area is the resource everything else competes for. Two moves free up more of it than any amount of clever styling.</p>
<h3>Wall-mount the bedside</h3>
<p>A floating shelf or a small wall-mounted table at mattress height does the job of a bedside table and gives you back the footprint underneath. It also means the vacuum goes straight through. Aim for the surface to sit roughly level with the top of the mattress, or a few centimetres above.</p>
<h3>Put the lighting on the wall too</h3>
<p>A plug-in wall light removes a lamp base from a surface that is already too small. If you read in bed, an adjustable arm matters more than the fitting&rsquo;s looks: you want to be able to point light at a page without lighting the whole room.</p>

<h2>Choose the bed for its base, not its headboard</h2>
<p>In a room under about 11 square metres, what happens under the mattress is more useful than what happens behind your head. In order of how much they give back:</p>
<ul>
<li><strong>Ottoman or lift-up base:</strong> the most storage, and the easiest to use badly. Good for bedding and off-season clothes; poor for anything you need weekly.</li>
<li><strong>Drawer base:</strong> less capacity, far more usable day to day. Check the drawer can open fully in the space you have &mdash; some need more clearance than the room allows.</li>
<li><strong>Open legs:</strong> no built-in storage, but it makes the floor read as continuous, which genuinely helps a tight room. Add flat boxes underneath.</li>
</ul>
<p>Whatever you choose, measure the diagonal route from the door to where the bed will stand before you order. Bases are rigid, and the frustrating part of a small bedroom is often the doorway rather than the room.</p>

<h2>Use the full height of one wall, not a bit of every wall</h2>
<p>Storage spread thinly around a room makes it feel busy. Storage concentrated on one wall, taken right up to the ceiling, reads as architecture. If you can only commit to one thing, take a single wardrobe wall to the ceiling and leave the other three walls calm.</p>
<p>The last 40 centimetres above a standard wardrobe is usually wasted. Boxes on top, labelled, will hold everything you use twice a year.</p>

<h2>Solve the "worn once" pile</h2>
<p>Every small bedroom has a chair, a rail or a floor patch performing this function. Naming it and giving it a proper home stops it colonising the room. Two hooks on the back of the door, or a slim rail on the wall beside the wardrobe, is enough. It is not glamorous advice, but it is the difference between a tidy room and a room that is tidy for two days.</p>

<h2>What to skip</h2>
<ul>
<li><strong>A bench at the foot of the bed,</strong> unless you have at least 75cm of clear floor beyond it. Otherwise it becomes a shin hazard and a laundry shelf.</li>
<li><strong>Deep shelving above the bed.</strong> It is unsettling to sleep under and awkward to reach.</li>
<li><strong>Painting everything white.</strong> A small room painted a deeper, warmer colour often feels intentional and calm rather than cramped, because the corners stop being visible.</li>
</ul>

<h2>A note on mirrors</h2>
<p>A mirror does make a small room feel larger, but only if it reflects something worth seeing &mdash; a window, a lamp, a doorway through to another room. A mirror reflecting a blank wall just adds another blank wall.</p>
',
		),

		array(
			'title'    => 'A Simple Method for Styling Open Shelves',
			'slug'     => 'styling-open-shelves',
			'category' => 'decor',
			'tags'     => array( 'shelf styling', 'living room', 'kitchen decor' ),
			'image'    => 'kkd-shelf-styling.jpg',
			'alt'      => 'Illustration of three open shelves holding books, boxes and vases of varying heights',
			'excerpt'  => 'Open shelves either look considered or look like a shelf. The difference comes down to grouping, height variation and leaving gaps on purpose.',
			'content'  => '
<p>Open shelving is unforgiving. A cupboard hides an untidy arrangement; a shelf displays it. The good news is that shelf styling follows a small number of rules that work regardless of what you own.</p>

<h2>Work in groups of two or three</h2>
<p>Objects placed at even intervals read as storage. Objects clustered into small groups with clear space between them read as a display. On a metre of shelf, aim for two or three groups rather than six evenly spaced items.</p>
<p>Inside a group, vary the height: something tall, something mid, something low and horizontal. A vase, a small bowl and a stack of two books is the classic trio, and it works because your eye travels down a slope rather than along a line.</p>

<h2>Leave a third of it empty</h2>
<p>This is the rule people resist and the one that makes the most difference. If roughly a third of the shelf length is visibly empty, everything else looks chosen. Fill the shelf completely and even beautiful objects start to read as clutter.</p>

<h2>Give heavy things the bottom</h2>
<p>Visual weight should sit low, exactly as it does in a room. Books, closed boxes and larger ceramics belong on the lower shelves; lighter, more delicate pieces go up. Reversed, the arrangement feels top-heavy even when it is perfectly safe.</p>

<h2>Use one or two closed boxes</h2>
<p>Open shelves need somewhere for the things that have no business being on display &mdash; chargers, batteries, receipts. Two matching lidded boxes solve this and read as part of the styling rather than an admission of defeat.</p>

<h2>Repeat one material</h2>
<p>A shelf with a wooden bowl, a wooden frame and a wooden box on different levels feels coherent. A shelf with one of everything feels like a shop. Pick one material or one colour and let it recur two or three times across the run.</p>

<h2>Turn some books around, but not all of them</h2>
<p>Removing dust jackets, or turning a few spines inwards to show pale page edges, calms a shelf down considerably &mdash; publishers design spines to shout. Do it to a section, not to everything: a shelf of anonymous paper blocks looks like a stage set.</p>

<h2>Check it from the doorway</h2>
<p>Shelves get styled from 30 centimetres away and looked at from three metres. Step back to where you normally see them from, and squint. At that distance you are seeing shapes and gaps, not objects, and any group that is not working becomes obvious immediately.</p>
',
		),

		/* -------------------------------------------------- Interior design */
		array(
			'title'    => 'How to Choose a Colour Scheme You Will Not Get Tired Of',
			'slug'     => 'choose-a-colour-scheme',
			'category' => 'interior-design',
			'tags'     => array( 'colour', 'paint', 'living room' ),
			'image'    => 'kkd-colour-scheme.jpg',
			'alt'      => 'Illustration of layered abstract bands in cream, sand, taupe and clay',
			'excerpt'  => 'Schemes that last are usually built from something already in the room rather than chosen from a chart. A practical method, plus the tests worth doing before you commit.',
			'content'  => '
<p>The colour scheme you regret is almost always the one chosen in a shop, from a chart, under fluorescent light, in a hurry. The scheme that still looks right in three years usually started from something already in the room.</p>

<h2>Start from a fixed object, not a favourite colour</h2>
<p>Every room contains things you are not going to change: a floor, a worktop, a sofa, a fireplace, the brick of the house opposite your window. These have undertones, and they are going to argue with anything you put next to them.</p>
<p>Pick the largest thing you cannot change and work outward from it. A floor with an orange note in it will make a cool grey look dirty; the same grey against a pale ash floor looks crisp. Neither is the wrong colour &mdash; it is the wrong pairing.</p>

<h2>Build with proportion in mind</h2>
<p>A useful starting split is roughly 60% for your main surface, 30% for a secondary, and 10% for an accent. The exact numbers matter less than the principle: one colour should dominate clearly. Two colours in equal measure read as indecision.</p>
<p>In practice, in a living room:</p>
<ul>
<li><strong>60%</strong> &mdash; walls, large rug, main upholstery.</li>
<li><strong>30%</strong> &mdash; curtains, a second seat, a large piece of art.</li>
<li><strong>10%</strong> &mdash; cushions, ceramics, book spines, a lamp base.</li>
</ul>

<h2>Keep undertones consistent</h2>
<p>This is the technical heart of it. Neutrals are never truly neutral: they lean warm (yellow, red, brown) or cool (blue, green, violet). A scheme built entirely from warm neutrals will feel harmonious. So will one built entirely from cool neutrals. Mixing them at similar lightness levels is what produces that vaguely grubby, hard-to-name effect.</p>
<p>To test a paint chip, put it next to a sheet of plain white printer paper. Against true white, the undertone becomes obvious in a way it never is on a chart surrounded by other colours.</p>

<h2>Test properly, or do not test at all</h2>
<p>A 5cm square of paint on a wall tells you almost nothing. Colour behaves differently at scale, and every wall is affected by what it faces.</p>
<ul>
<li>Paint at least an A2 area, two coats, and let it dry fully. Wet paint reads darker and often cooler.</li>
<li>Better still, paint a sheet of lining paper or card so you can move it around the room.</li>
<li>Look at it in the morning, at 4pm, and at 9pm with the lamps on. A colour that only works at one of those times is not a colour that works.</li>
<li>Hold it against the floor and the sofa, not just the wall.</li>
</ul>

<h2>Which way does the room face?</h2>
<p>Orientation changes the light, and the light changes the colour more than the tin does.</p>
<ul>
<li><strong>North-facing:</strong> steady, cool, slightly grey light all day. Warm colours hold up well here; cool greys can turn flat and blue.</li>
<li><strong>South-facing:</strong> bright and warm for much of the day. Cooler colours stay true; strong warm colours can become intense.</li>
<li><strong>East-facing:</strong> warm early, cool later. Consider when you actually use the room.</li>
<li><strong>West-facing:</strong> cool morning, strong warm evening light. Good for rooms used at night.</li>
</ul>

<h2>Deciding on a finish</h2>
<p>Finish affects perceived colour as much as pigment does. A matt finish absorbs light and reads deeper and softer; an eggshell or satin reflects and reads lighter and slightly cooler. If a colour is almost right but feels heavy, the same colour in a lower sheen may solve it.</p>

<h2>Two habits that make a scheme age well</h2>
<p>First, repeat every accent colour at least three times around the room, at different heights. A single burst of colour looks accidental; three occurrences look like a decision.</p>
<p>Second, leave one thing undecided. A wall you have not committed to, or a chair you have not recovered, gives the room somewhere to grow. Schemes that are finished to the last cushion are the ones that feel dated fastest.</p>
',
		),

		array(
			'title'    => 'Reading a Room: How Light Changes Every Colour You Choose',
			'slug'     => 'how-light-changes-colour',
			'category' => 'interior-design',
			'tags'     => array( 'lighting', 'colour', 'paint' ),
			'image'    => 'kkd-lighting.jpg',
			'alt'      => 'Illustration of a paned window between curtains with light falling on the floor',
			'excerpt'  => 'Before choosing a single colour, spend a day watching the light in the room. Here is what to look for, and what it means for your decisions.',
			'content'  => '
<p>Paint colour is a collaboration between pigment and light. You control one half of that. The other half is decided by which way your windows face, what is outside them, and what bulbs you own &mdash; and it will override your colour choice every time.</p>

<h2>Spend one day watching</h2>
<p>Before choosing anything, look at the room at three points: mid-morning, late afternoon, and after dark with the lights on. Note where light lands, where it never reaches, and what colour the light itself appears to be. This costs nothing and prevents the most expensive kind of mistake.</p>

<h2>What is outside the window matters</h2>
<p>Light does not arrive neutral. It arrives having bounced off whatever is outside.</p>
<ul>
<li>A tree or hedge sends green light into the room, strongest in summer. Cool greens and greys can turn swampy.</li>
<li>A red brick wall opposite pushes warm light in, which flatters warm neutrals and muddies cool ones.</li>
<li>A pale paved terrace or a light-coloured building bounces a lot of bright, fairly neutral light upward &mdash; often onto the ceiling, which then acts as a second light source.</li>
</ul>

<h2>Deep colours need light to live</h2>
<p>A dark green or a deep clay can be beautiful in a room with little natural light, but only if the artificial lighting is good. Deep colours absorb light, so a single ceiling bulb will make them read as brown or black after dark. Plan the lamps at the same time as the paint, not afterwards.</p>

<h2>Ceilings are a lighting decision</h2>
<p>A brilliant white ceiling above a warm wall colour often looks like a mistake, because the join between them is a hard cool-to-warm edge. Two options work better: paint the ceiling in the wall colour diluted with white, or use a warm off-white rather than a pure one. The room will feel lower but considerably more finished.</p>

<h2>Get a consistent bulb temperature</h2>
<p>A room with a 2700K lamp, a 4000K downlight and a daylight bulb in a task light will never look coherent, whatever is on the walls. Pick one temperature per room &mdash; 2700K for living rooms and bedrooms, 3000K where you need to see detail &mdash; and replace anything that does not match. It is the cheapest improvement in decorating.</p>

<h2>The practical test</h2>
<p>Paint two large boards in your shortlisted colours. Stand one against the wall that gets most light and one against the darkest wall, then swap them. If a colour only works in one position, you have learnt something useful: either it is not the right colour, or that dark corner needs a lamp before any colour will work there.</p>
',
		),

		array(
			'title'    => 'Layout Before Furniture: Planning a Room on Paper',
			'slug'     => 'planning-a-room-layout',
			'category' => 'interior-design',
			'tags'     => array( 'layout', 'measuring', 'living room', 'dining' ),
			'image'    => 'kkd-dining.jpg',
			'alt'      => 'Illustration of a low sofa, table and lamp arranged on a round rug',
			'excerpt'  => 'Twenty minutes with a tape measure and a sheet of paper prevents most furniture mistakes. The clearances that matter, and how to test a layout before you buy.',
			'content'  => '
<p>Almost every piece of furniture that gets returned was the right piece in the wrong room. A plan on paper takes twenty minutes and catches the problem while it is still free to fix.</p>

<h2>Measure more than the walls</h2>
<p>Wall lengths are the easy part. The measurements that actually decide a layout are:</p>
<ul>
<li>Window sill height, and how far the window is from each corner.</li>
<li>Radiator position, width and depth.</li>
<li>Which way each door swings, and how far into the room.</li>
<li>Socket and switch positions &mdash; a sofa that covers the only socket will annoy you daily.</li>
<li>Ceiling height, if you are considering anything tall.</li>
<li>The delivery route: doorway widths, stair turns, and the diagonal of the tightest corner.</li>
</ul>

<h2>Draw it at a real scale</h2>
<p>Squared paper at 1:50 &mdash; one small square to 10cm &mdash; is enough. Cut paper rectangles for each piece of furniture at the same scale and move them around. Doing this physically is faster than any app, and it makes bad layouts obvious rather than arguable.</p>

<h2>The clearances worth knowing</h2>
<table>
<thead>
<tr><th>Situation</th><th>Clearance to aim for</th></tr>
</thead>
<tbody>
<tr><td>Main walking route through a room</td><td>90cm, 75cm at an absolute minimum</td></tr>
<tr><td>Secondary route, used occasionally</td><td>60cm</td></tr>
<tr><td>Sofa to coffee table</td><td>40&ndash;45cm</td></tr>
<tr><td>Behind a dining chair, to pull out and stand</td><td>90cm; 75cm if nobody walks behind</td></tr>
<tr><td>In front of a wardrobe or chest of drawers</td><td>Depth of the open drawer, plus 40cm</td></tr>
<tr><td>Beside a bed, to walk past</td><td>60cm</td></tr>
<tr><td>Television to the nearest seat</td><td>Roughly 1.5&ndash;2.5&times; the screen width</td></tr>
</tbody>
</table>

<h2>Then tape it out</h2>
<p>Once a plan looks right, mark it on the actual floor with low-tack masking tape &mdash; the full footprint of the sofa, the table, the rug. Live with the tape for a couple of days and walk your normal routes. This is where you discover that the armchair blocks the way to the kitchen, or that the beautiful table leaves no room to open the oven.</p>

<h2>Where layouts usually go wrong</h2>
<ul>
<li><strong>Everything against the walls.</strong> Leaves a dead space in the middle and makes conversation awkward.</li>
<li><strong>A rug that is too small,</strong> which shrinks the whole arrangement rather than anchoring it.</li>
<li><strong>Nothing to put a drink on.</strong> Every seat needs a surface within reach.</li>
<li><strong>One enormous piece.</strong> A three-seat sofa that fits with 4cm to spare will make the room feel permanently full.</li>
<li><strong>Ignoring the view from the door.</strong> The first thing you see on entering sets the impression of the whole room; make it something you like.</li>
</ul>
',
		),

		/* -------------------------------------------------------------- DIY */
		array(
			'title'    => 'Painting a Room Properly: The Prep That Makes the Difference',
			'slug'     => 'painting-a-room-prep',
			'category' => 'diy',
			'tags'     => array( 'paint', 'diy project', 'weekend project' ),
			'image'    => 'kkd-paint-project.jpg',
			'alt'      => 'Illustration of an arched doorway with a plant and a storage box beside it',
			'excerpt'  => 'The difference between a decent paint job and a professional-looking one is almost entirely in the hours before the first coat. Here is what those hours involve.',
			'content'  => '
<p>Painting a room is not difficult. Painting a room so it still looks good in raking evening light, with crisp edges and no visible roller marks, is a matter of preparation. Roughly two-thirds of the time should go in before the lid comes off.</p>
<p>Read the instructions on any filler, primer or paint you use, and follow the manufacturer&rsquo;s guidance on ventilation and drying times &mdash; they vary more than you would expect between products.</p>

<h2>Clear and protect</h2>
<p>Take everything out that can leave the room. Whatever must stay goes to the middle and gets covered. Cotton dust sheets on the floor rather than plastic: plastic is slippery and paint sits wet on it for hours, waiting to be walked through.</p>
<p>Take off switch plates and socket covers rather than taping around them. It takes five minutes, and it is the clearest tell between a careful job and a rushed one. Turn off the circuit first.</p>

<h2>Wash the walls</h2>
<p>Paint sticks to a clean surface and slides off a greasy one. Sugar soap or a mild detergent solution, top to bottom, then rinse with clean water and let it dry fully. Kitchens and rooms above radiators need this most &mdash; there is usually a film there you cannot see until a cloth comes away grey.</p>

<h2>Fill, then sand, then fill again</h2>
<p>Work along each wall with a torch held flat against it. Raking light throws every dent and old fixing into relief, including ones invisible head-on.</p>
<ul>
<li>Fill small holes slightly proud of the surface; filler shrinks as it dries.</li>
<li>Sand back flush with a sanding block rather than loose paper, so you flatten rather than dish the repair.</li>
<li>Check with the torch again. Deep holes almost always need a second pass.</li>
<li>Vacuum the dust, then wipe with a barely damp cloth. Dust under paint looks like grit forever.</li>
</ul>

<h2>Caulk the gaps</h2>
<p>The line where skirting meets wall, and around door architrave, usually has a fine crack in it. A thin bead of decorator&rsquo;s caulk, smoothed with a wet fingertip, closes it. This single step does more for a "finished" look than anything else on this list, because it removes the shadow lines that read as scruffiness.</p>

<h2>Prime what needs priming</h2>
<p>Not everything needs a primer, but some things genuinely do: bare plaster (use a mist coat &mdash; emulsion thinned per the tin&rsquo;s instructions), filler repairs, water stains, and any strong colour you are covering with a pale one. Skipping primer over patches produces flashing &mdash; dull spots that show through two topcoats.</p>

<h2>Order of work</h2>
<ol>
<li>Ceiling.</li>
<li>Walls.</li>
<li>Woodwork last &mdash; skirting, architrave, doors.</li>
</ol>
<p>Working downwards means splashes land on surfaces you have not finished yet. Woodwork goes last because it is the fiddliest and you want a steady hand and a tidy room.</p>

<h2>Cutting in</h2>
<p>A good 50mm angled brush and a steady hand beat masking tape in most situations, and there is no tape line to peel. Load the brush about a third of the way up the bristles, tap off the excess rather than scraping it, and lay a line 5mm away from the edge first. Then use a second, lighter pass to push the paint up to the edge. The paint already on the wall guides the brush.</p>
<p>If you do use tape, seal the edge by painting the base colour over it first and letting it dry. That way any bleed is the colour that is already there.</p>

<h2>Rolling without marks</h2>
<p>Work in sections roughly a metre square. Roll a loose "W", then fill it in without lifting the roller, then finish with light vertical strokes from top to bottom in one pass. Keep a wet edge &mdash; always roll back into paint that is still wet, or the join will show.</p>
<p>Two thin coats beat one thick one every time. Respect the recoat time on the tin; going back too early drags the first coat and leaves texture you cannot sand out later.</p>

<h2>Cleaning up</h2>
<p>Wrap brushes and roller sleeves in a plastic bag between coats rather than washing them &mdash; they stay usable for a day. Wash them properly at the end, and store brushes hanging or flat, never resting on the bristles. A good brush that is looked after outlasts several cheap ones and cuts a better line every time.</p>

<h2>What it takes</h2>
<p>For an average bedroom, expect a full day of preparation and a second day for painting, with drying time in between. Nobody enjoys the first day. It is, however, the day that decides how the room looks.</p>
',
		),

		array(
			'title'    => 'Hanging a Gallery Wall Straight, First Time',
			'slug'     => 'hanging-a-gallery-wall',
			'category' => 'diy',
			'tags'     => array( 'gallery wall', 'diy project', 'art' ),
			'image'    => 'kkd-gallery-wall.jpg',
			'alt'      => 'Illustration of four picture frames of different sizes above a console table',
			'excerpt'  => 'Lay it out on the floor, template it in paper, and measure to the hook rather than the frame. Three steps that avoid a wall full of spare holes.',
			'content'  => '
<p>A gallery wall is only difficult because mistakes are permanent. Work in a sequence where every decision is reversible until the last one, and it becomes straightforward.</p>

<h2>Lay it out on the floor first</h2>
<p>Arrange the frames on the floor in front of the wall, in the shape you want. Keep the spacing consistent &mdash; 5 to 8cm between frames reads as a group; more than about 10cm and they read as separate pictures.</p>
<p>Two arrangements that reliably work: a grid of identical frames, or an asymmetric cluster with one clear anchor piece and a consistent gap. What rarely works is a near-grid, where near-alignment reads as a wobble.</p>

<h2>Template in paper</h2>
<p>Draw around each frame on newspaper or lining paper, cut out the shapes, and tape them to the wall with masking tape. Now you can stand back, adjust, and live with it for an hour. This is where most layouts change.</p>
<p>Mark the hook position on each paper template while you have the frame in hand. Measure from the top of the frame down to the taut hanging wire or the D-ring, and transfer that distance onto the template. Drill through the paper at the mark: the hole ends up exactly where the hook needs to be.</p>

<h2>Get the height right</h2>
<p>Centre the group at eye level &mdash; roughly 145 to 150cm from the floor to the middle of the arrangement. The common mistake is hanging too high, because standing next to a wall makes eye level feel higher than it is.</p>
<p>Above furniture, the rule changes: the bottom of the lowest frame should sit 15 to 25cm above the sofa back or console top. Any more and the art floats away from the furniture.</p>

<h2>Fixings</h2>
<p>Match the fixing to the wall and the weight, and check the manufacturer&rsquo;s stated load. A frame that comes down takes a piece of plaster with it.</p>
<ul>
<li><strong>Plasterboard, light frames:</strong> a hardened picture hook is usually enough.</li>
<li><strong>Plasterboard, anything heavier:</strong> a proper plasterboard anchor, or fix into a stud.</li>
<li><strong>Masonry:</strong> a masonry bit and wall plug, and expect dust &mdash; hold a vacuum nozzle below the hole.</li>
</ul>
<p>Before drilling, check for cables and pipes with a detector, particularly directly above or below sockets and switches, and in the zones beside door frames.</p>

<h2>Finishing</h2>
<p>Hang from the centre outwards, checking each frame with a small spirit level as you go. Two small self-adhesive bumpers on the bottom corners of each frame stop them drifting out of level every time a door closes &mdash; the detail that keeps the wall looking straight months later.</p>
',
		),

		/* ----------------------------------------------------- Organization */
		array(
			'title'    => 'Entryway Storage That Survives a Weekday Morning',
			'slug'     => 'entryway-storage-ideas',
			'category' => 'organization',
			'tags'     => array( 'entryway', 'storage', 'small space ideas' ),
			'image'    => 'kkd-entryway.jpg',
			'alt'      => 'Illustration of an arched hallway opening with a plant and a storage box',
			'excerpt'  => 'An entryway fails at 8am, not on a Sunday afternoon. Design it around the four things that pile up there and it stays clear.',
			'content'  => '
<p>Entryways collapse under a specific, predictable load: coats, shoes, bags and small objects with no home. Any system that does not have a defined place for all four will fail, no matter how good it looks.</p>

<h2>Count what actually arrives</h2>
<p>Before buying anything, count. How many coats are in daily use per person in winter? How many pairs of shoes are genuinely in rotation? Design for that number plus two, not for the total number of coats you own. Everything else belongs in a wardrobe.</p>

<h2>Hooks beat hangers</h2>
<p>A rail with hangers requires two hands and eight seconds. A hook requires one hand and one second. In an entryway, the fast option is the one that gets used. Fit hooks at two heights &mdash; around 165cm for adults, 110cm for children &mdash; and allow 20cm between them or coats will bunch.</p>

<h2>Shoes need a defined edge</h2>
<p>Shoes spread unless something stops them. A shallow tray, a low bench with a shelf underneath, or a simple rack all work; what matters is that the storage has a hard limit. When it is full, the message is unambiguous, and that is the point.</p>
<p>Slatted or open storage is worth it here. Wet shoes in a closed cupboard stay wet and start to smell.</p>

<h2>Give small objects one bowl</h2>
<p>Keys, cards, sunglasses, headphones, the odd screw. One bowl or shallow dish, on a surface at hand height near the door. One, not three &mdash; multiple containers means nothing has a definite home and the search starts again every morning.</p>

<h2>Somewhere to put a bag down</h2>
<p>The most-missed element. A narrow shelf, a small bench, even a sturdy stool. Without it, bags go on the floor in the walking route. 30cm of depth is plenty.</p>

<h2>Small entryways</h2>
<p>Where there is no floor space at all:</p>
<ul>
<li>A slim wall-mounted shelf with hooks underneath does three jobs in about 12cm of depth.</li>
<li>Use the back of the front door, if it opens flat against a wall, for a hook rail.</li>
<li>Take one narrow run of storage to the ceiling for things you need seasonally.</li>
<li>Mirror one wall &mdash; genuinely useful on the way out, and it makes a tight hall workable.</li>
</ul>

<h2>The maintenance rule</h2>
<p>An entryway needs a 60-second reset, not a weekly tidy. If putting it back in order takes longer than a minute, the system has too many parts. Reduce it until it does.</p>
',
		),

		array(
			'title'    => 'Kitchen Storage: Fixing the Cupboard You Dread Opening',
			'slug'     => 'kitchen-cupboard-storage',
			'category' => 'organization',
			'tags'     => array( 'kitchen decor', 'storage', 'organization' ),
			'image'    => 'kkd-kitchen.jpg',
			'alt'      => 'Illustration of open kitchen shelving holding jars, boxes and small containers',
			'excerpt'  => 'Most kitchen storage problems are depth problems. Fix the reach, group by task rather than by type, and the cupboard stays usable.',
			'content'  => '
<p>There is one in every kitchen: the cupboard where things go in and do not come out. It is rarely a shortage of space. It is almost always that the space is too deep to see into, and that things are grouped by what they are rather than by when they are used.</p>

<h2>Depth is the real problem</h2>
<p>A standard base unit is around 55&ndash;60cm deep. Anything past roughly 35cm is out of easy sight, so it becomes storage for things you forget you own. Three fixes, in order of cost:</p>
<ul>
<li><strong>Free:</strong> put the back third to work as deliberate long-term storage &mdash; the food processor, the roasting tin used at Christmas &mdash; and keep the front two-thirds for daily items.</li>
<li><strong>Cheap:</strong> shallow bins or trays that pull out as a unit. The bin comes to you rather than you reaching past things.</li>
<li><strong>More involved:</strong> retrofit pull-out shelves or a drawer conversion. The best value upgrade in most kitchens, because it turns dead depth into usable space.</li>
</ul>

<h2>Group by task, not by type</h2>
<p>Storing all the bowls together makes sense on a shelf plan and no sense in use. Group instead by what you do:</p>
<ul>
<li><strong>Morning:</strong> mugs, the coffee kit, cereal bowls &mdash; all together, near the kettle.</li>
<li><strong>Cooking:</strong> oils, salt, pepper, the utensils you reach for while a pan is hot &mdash; within one step of the hob.</li>
<li><strong>Baking:</strong> scales, tins, dry goods &mdash; one cupboard, since it all comes out at once.</li>
<li><strong>Occasional:</strong> the platter, the fondue set. High or deep, and out of the way.</li>
</ul>
<p>Judge a kitchen by how many steps and how many doors it takes to make a cup of tea. Under two of each is a well-organised kitchen.</p>

<h2>Decant only where it earns its place</h2>
<p>Matching jars look wonderful and are worth it for things you use constantly &mdash; flour, rice, pasta, coffee. For everything else, decanting adds a chore and loses the cooking instructions and best-before date. If you do decant, write the date and any cooking ratio on the base in pencil.</p>

<h2>Use the door and the wall</h2>
<p>Cupboard doors hold a surprising amount: a slim rack for foil and cling film, a hook for measuring spoons. On the wall, a rail with S-hooks near the hob keeps the tools you use every day off the worktop. Keep it to items in genuine daily use, or it becomes a dust trap.</p>

<h2>Under the sink</h2>
<p>The worst-used cupboard in most kitchens because of the pipework. A small stepped riser or a two-tier pull-out works around the trap and doubles the usable area. Keep cleaning products in a single caddy you can lift out whole &mdash; and if there are children in the house, fit a cupboard lock and follow the safety guidance on the labels.</p>

<h2>The test</h2>
<p>Empty one cupboard completely onto the worktop. Anything you cannot remember using in the last year goes elsewhere or goes away. Then put the rest back grouped by task. It takes half an hour per cupboard and it holds, because you have changed the logic rather than just tidied.</p>
',
		),

		/* -------------------------------------------------------- Furniture */
		array(
			'title'    => 'How to Measure for a Sofa Before You Buy',
			'slug'     => 'how-to-measure-for-a-sofa',
			'category' => 'furniture',
			'tags'     => array( 'sofa', 'measuring', 'living room', 'furniture buying' ),
			'image'    => 'kkd-sofa-guide.jpg',
			'alt'      => 'Illustration of a sofa with rounded arms, cushions, a low table and a floor lamp',
			'excerpt'  => 'A sofa is the piece most often bought in the wrong size. The measurements that matter, the delivery check almost everyone forgets, and the comfort details to test in the shop.',
			'content'  => '
<p>A sofa is expensive, long-lived and awkward to return. It is also the piece most frequently bought at the wrong size &mdash; usually too large, occasionally too deep, and often too tall in the back for the room it lands in.</p>

<h2>The room measurements</h2>
<p>Write these down before looking at anything:</p>
<table>
<thead>
<tr><th>Measure</th><th>Why it matters</th></tr>
</thead>
<tbody>
<tr><td>Wall length, minus 20cm</td><td>A sofa filling a wall to the centimetre makes the room feel jammed. Leave breathing space at each end.</td></tr>
<tr><td>Distance to the opposite wall or furniture</td><td>You need 90cm for a main walkway, 40&ndash;45cm from seat front to coffee table.</td></tr>
<tr><td>Window sill height</td><td>A sofa back higher than the sill will cut across the window from outside and inside.</td></tr>
<tr><td>Radiator position</td><td>Blocking a radiator with an upholstered back wastes heat and can mark the fabric.</td></tr>
<tr><td>Socket positions</td><td>You will want a lamp beside the sofa, and a cable running across a walkway is a trip hazard.</td></tr>
</tbody>
</table>

<h2>The delivery route &mdash; do this before anything else</h2>
<p>More sofas fail at the door than in the room. Measure, in this order:</p>
<ol>
<li>The narrowest doorway on the route, width and height, with the door removed if it can be.</li>
<li>Any turn in a hallway or on a staircase: measure the diagonal across the corner, not the corridor width.</li>
<li>Stair width, and the headroom under any half-landing.</li>
<li>Lift dimensions, including depth and door width, if relevant.</li>
</ol>
<p>Compare against the sofa&rsquo;s <em>diagonal depth</em> &mdash; the measurement from the top back corner to the front bottom corner, which is how a sofa is actually tipped through a doorway. Good retailers publish it; if it is missing, ask, and ask whether the legs and back come off. A sofa with removable legs and a knock-down back will get almost anywhere.</p>

<h2>The comfort measurements</h2>
<p>Two sofas with identical external dimensions can feel completely different. What matters:</p>
<ul>
<li><strong>Seat depth</strong> &mdash; the usable front-to-back of the cushion, not the sofa&rsquo;s overall depth. Around 55cm suits most people for upright sitting; 60cm and over suits lounging but leaves shorter sitters with no back support.</li>
<li><strong>Seat height</strong> &mdash; 43&ndash;48cm suits most. Lower looks contemporary but is harder to get out of, which matters more over years than it does in a showroom.</li>
<li><strong>Back height</strong> &mdash; a low back looks light in a room but supports the shoulders rather than the neck. If you nap on the sofa, you want a high back or a corner to lean into.</li>
<li><strong>Arm height and width</strong> &mdash; a wide arm eats seat width; a low arm makes a better headrest.</li>
</ul>

<h2>What to check in the showroom</h2>
<p>Sit for at least five minutes, in the way you actually sit at home. Then:</p>
<ul>
<li>Press the seat down and let go. It should recover, not stay dented.</li>
<li>Lift one front corner slightly. A well-built frame lifts as a unit; a weak one twists and creaks.</li>
<li>Look underneath. A hardwood frame with joints that are screwed, dowelled or glued, plus webbing or serpentine springs, is a good sign. Staples into softwood are not.</li>
<li>Check whether cushion covers unzip. Being able to wash or replace covers is the difference between a sofa lasting five years and fifteen.</li>
<li>Ask for the fabric&rsquo;s abrasion rating. For a family living room, look for a durable upholstery-grade fabric and ask the retailer what they recommend for heavy daily use.</li>
</ul>

<h2>Test it at home before it arrives</h2>
<p>Mark the full footprint on your floor with masking tape, including the arms, and add a rectangle for the coffee table. Live with it for two days. Walk the route to the kitchen with a full mug. This is where you find out that the 220cm sofa works and the 240cm does not.</p>

<h2>Common mistakes</h2>
<ul>
<li>Judging scale in a showroom, where ceilings are high and the floor is enormous. Everything looks smaller there.</li>
<li>Choosing a corner unit for a room that needs a walkway through the corner.</li>
<li>Forgetting that a sofa bed needs its opened depth measured too.</li>
<li>Buying the largest sofa that fits, rather than the one that leaves the room usable.</li>
</ul>
',
		),

		array(
			'title'    => 'Buying Second-Hand Furniture: What to Check',
			'slug'     => 'buying-second-hand-furniture',
			'category' => 'furniture',
			'tags'     => array( 'furniture buying', 'budget-friendly', 'second-hand' ),
			'image'    => 'kkd-storage.jpg',
			'alt'      => 'Illustration of shelving units holding boxes, books and containers',
			'excerpt'  => 'Older furniture is often better made than its modern equivalent, and often cheaper. A short list of checks that separates a bargain from a project.',
			'content'  => '
<p>Second-hand furniture is where the quality-to-price ratio is best, largely because solid timber construction was normal for far longer than it has been fashionable. It is also where you can buy a problem. These checks take two minutes each.</p>

<h2>Check the joints, not the surface</h2>
<p>Surface damage is cosmetic and usually fixable. Joints are structural and usually are not, at least not cheaply.</p>
<ul>
<li>Pull gently at a drawer front. If it flexes or clicks, the joint has gone.</li>
<li>Look for dovetails in drawer sides &mdash; interlocking fingers of wood. It signals a piece built to last.</li>
<li>Rock a table or chair on a flat floor. Movement means a loose joint. Repairable, but factor in the time.</li>
<li>Look underneath for previous repairs. Screws and metal brackets across a joint usually mean a glue joint failed and was patched.</li>
</ul>

<h2>Identify what it is made of</h2>
<p>Look at an edge, ideally an unfinished one underneath. Solid timber shows grain running through and continuing round the corner. Veneered board shows a thin decorative layer over a different core. Neither is disqualifying &mdash; good veneer over stable board is often better behaved than solid wood &mdash; but it changes what you can do. Solid timber sands and refinishes; veneer sands through in seconds.</p>

<h2>Smell it and look for damp</h2>
<p>A musty smell in a chest or wardrobe rarely leaves. Check the back panel and the underside of the base for water staining, lifting, or a chalky bloom. Furniture stored in a damp garage can look fine and smell wrong forever.</p>

<h2>Check for woodworm carefully</h2>
<p>Small round holes, roughly 1&ndash;2mm across, are exit holes. Fine, pale dust beneath them suggests activity may be recent rather than historic. If in doubt, get advice before bringing the piece into a home with other timber furniture, and follow the instructions on any treatment product exactly.</p>

<h2>Upholstery is a different calculation</h2>
<p>Assess the frame and ignore the fabric. A good frame is worth reupholstering; a poor frame is not worth the fabric. Get a quote before you buy &mdash; reupholstering a chair frequently costs more than the chair did, and considerably more than people expect. Also check whether the piece carries the required fire-safety labelling for resale in your country, as rules differ.</p>

<h2>Measure, then measure the doorway</h2>
<p>Older furniture was built for older houses, and wardrobes in particular are often taller than a modern ceiling or wider than a modern stairwell. Take the tape measure with you, and check whether the piece dismantles.</p>

<h2>What is usually worth buying</h2>
<ul>
<li><strong>Chests of drawers and sideboards</strong> &mdash; solid, simple, and far better made than budget equivalents.</li>
<li><strong>Dining tables</strong> &mdash; a scratched solid top sands back to new.</li>
<li><strong>Wooden chairs</strong> &mdash; loose joints are a straightforward repair with glue and clamps.</li>
<li><strong>Mirrors and frames</strong> &mdash; almost always cheaper second-hand, and older glass has a character new glass does not.</li>
</ul>

<h2>What to be cautious about</h2>
<ul>
<li>Anything with an old electrical component. Have it checked by a qualified electrician before use.</li>
<li>Flat-pack that has been dismantled and rebuilt. The fixings are usually chewed out.</li>
<li>Mattresses and anything else where hygiene is the main issue.</li>
<li>Cots, high chairs and other children&rsquo;s items, which are covered by safety standards that older pieces may not meet.</li>
</ul>
',
		),

		/* -------------------------------------------------------- Lifestyle */
		array(
			'title'    => 'Decorating for Autumn Without Buying Anything New',
			'slug'     => 'autumn-decorating-no-shopping',
			'category' => 'lifestyle',
			'tags'     => array( 'seasonal decorating', 'budget-friendly', 'textiles' ),
			'image'    => 'kkd-seasonal.jpg',
			'alt'      => 'Illustration of layered curved bands in warm cream, sand and clay tones',
			'excerpt'  => 'Seasonal decorating is mostly rearranging. Six changes that shift a home into autumn using what is already in your cupboards.',
			'content'  => '
<p>The seasonal decorating industry would prefer you bought a new set of cushions four times a year. In practice, the shift from summer to autumn in a home is about weight, light and where things sit &mdash; all of which you can change for nothing.</p>

<h2>Change the light before anything else</h2>
<p>Summer light comes from windows; autumn light comes from lamps. Move at least one lamp lower and closer to where people sit, and start using it earlier in the afternoon. If you have a dimmer, drop the ceiling light and let the lamps do the work. This one change does more than any amount of styling.</p>

<h2>Swap light textiles for heavy ones</h2>
<p>You almost certainly own both. Linen and cotton out, wool and heavier weaves in. If curtains are unlined and thin, hang them with a spare blanket doubled behind &mdash; it improves both the look and the draught.</p>

<h2>Bring the rug forward</h2>
<p>Rugs that are pushed halfway under furniture in summer can come forward in autumn so more of them is visible and underfoot. If you have a rug rolled up in a cupboard, layer it over a larger flat one. Layered rugs are the single most autumnal thing you can do with no purchase.</p>

<h2>Rearrange for the fireplace or the sofa</h2>
<p>Summer arrangements tend to face outward, towards a window or a garden door. Autumn arrangements face inward, towards each other or towards a fire. Turning two chairs 30 degrees inward changes how a room feels to sit in.</p>

<h2>Move warm objects to eye level</h2>
<p>Go around the house and gather anything wooden, brass, amber, terracotta or deep red, then put those things where you see them &mdash; the shelf you pass on the stairs, the console by the door, the coffee table. Move the pale, cool and glassy pieces to a cupboard for a few months. Same objects, different season.</p>

<h2>Use what is outside</h2>
<p>Bare branches in a tall jug last for months and cost nothing. So do seed heads, dried hydrangea and a bowl of whatever is in season. It reads as considered because it is genuinely of the moment.</p>

<h2>One last practical thing</h2>
<p>Autumn is when draughts announce themselves. Half an hour spent finding them &mdash; letterbox, floorboard gaps, the bottom of an unused door &mdash; will do more for how a home feels in November than any decorative change on this list.</p>
',
		),

		array(
			'title'    => 'A Room-by-Room Reset That Takes One Evening',
			'slug'     => 'one-evening-home-reset',
			'category' => 'lifestyle',
			'tags'     => array( 'organization', 'routines', 'small space ideas' ),
			'image'    => 'kkd-bathroom.jpg',
			'alt'      => 'Illustration of an arched alcove with a plant and a low storage unit',
			'excerpt'  => 'Not a deep clean and not a declutter. A repeatable ninety-minute circuit that returns a home to its baseline, room by room.',
			'content'  => '
<p>There is a difference between cleaning a house and resetting it. Cleaning takes a day. A reset takes about ninety minutes and returns every room to the state it is supposed to be in, which is usually what people actually mean when they say the house feels chaotic.</p>
<p>The trick is to work by room and by category, never by object. Carrying one thing at a time to where it belongs is how an evening disappears.</p>

<h2>Before you start: two containers</h2>
<p>Take a basket and a bin bag with you. Anything belonging in another room goes in the basket, not in your hands. Anything that is rubbish goes in the bag immediately. You do the basket delivery run once, at the end.</p>

<h2>Living room &mdash; 20 minutes</h2>
<ol>
<li>Clear every horizontal surface completely. Not tidy &mdash; clear.</li>
<li>Wipe the surfaces while they are empty.</li>
<li>Put back only what belongs there. Usually about half of what was on them.</li>
<li>Straighten the rug, plump and square the cushions, fold throws in half over an arm.</li>
<li>Turn on the lamps you want on, and check no cables cross a walkway.</li>
</ol>

<h2>Kitchen &mdash; 25 minutes</h2>
<ol>
<li>Empty the dishwasher or the drainer first. Nothing else can be put away until there is somewhere to put it.</li>
<li>Clear the worktops entirely, wipe, and return only daily-use items.</li>
<li>Deal with the fridge door and the top of the fridge, which collect paper.</li>
<li>Take out the bins and put in fresh liners.</li>
<li>Fold the tea towel. It is a small thing that makes the room read as finished.</li>
</ol>

<h2>Entryway &mdash; 5 minutes</h2>
<p>Coats on hooks, shoes in the rack, the small-objects bowl emptied of anything that is not keys. If this takes more than five minutes, the entryway needs a better system rather than more effort.</p>

<h2>Bathroom &mdash; 15 minutes</h2>
<ol>
<li>Everything off the surfaces and out of the bath edge.</li>
<li>Wipe the basin, the taps and the mirror.</li>
<li>Return only what is in daily use. The rest goes in a cupboard or a basket.</li>
<li>Fresh towels, folded the same way. Matching folds do a surprising amount of work.</li>
</ol>

<h2>Bedrooms &mdash; 15 minutes each</h2>
<ol>
<li>Make the bed properly, pulling the sheet tight rather than smoothing the duvet over a mess.</li>
<li>Clear the bedside table down to a lamp, a book and a glass.</li>
<li>Deal with the worn-once pile &mdash; hooks or wardrobe, not the chair.</li>
<li>Open a window for ten minutes, whatever the weather.</li>
</ol>

<h2>The last five minutes</h2>
<p>Do the basket run, delivering everything to its room. Then walk the whole flat or house once, from the front door, looking at it the way a visitor would. You will spot two or three things &mdash; a crooked picture, a light left on in an empty room, a door standing open &mdash; that take seconds and change the impression entirely.</p>

<h2>Why it works</h2>
<p>A reset is repeatable because it has an end state and a fixed length. Decluttering does not, which is why it gets postponed. Run the circuit once a week and the deep clean, when it comes, is a much smaller job.</p>
',
		),
	);
}
