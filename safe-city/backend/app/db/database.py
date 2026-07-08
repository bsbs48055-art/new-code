import databases
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from config import settings

DATABASE_URL = settings.DATABASE_URL
DATABASE_URL_SYNC = settings.DATABASE_URL_SYNC

database = databases.Database(DATABASE_URL)

async_engine = create_async_engine(DATABASE_URL, echo=settings.DEBUG, pool_pre_ping=True)
AsyncSessionLocal = sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

sync_engine = create_engine(DATABASE_URL_SYNC, echo=settings.DEBUG)
metadata = MetaData()


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
