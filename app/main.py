
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse, FileResponse
from sqlalchemy.orm import Session
import os

from .database import engine, Base, SessionLocal
from .routers import containers
from . import models

app = FastAPI(title="Virtual Freezer API")
app.include_router(containers.router)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

Base.metadata.create_all(bind=engine)

@app.get("/favicon.ico")
def favicon():
    # Return a simple favicon or 204 No Content
    return RedirectResponse(url="/static/favicon.ico", status_code=301)

@app.get("/")
def root():
    # Redirect root to the front-end
    return RedirectResponse("/static/index.html")

@app.on_event("startup")
def seed():
    """Initialize database tables but don't create any containers."""
    db: Session = SessionLocal()
    try:
        # Just ensure tables exist, no automatic data creation
        pass
    finally:
        db.close()
