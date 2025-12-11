
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from .database import engine, Base, SessionLocal
from .routers import containers
from . import models

app = FastAPI(title="Virtual Freezer API")
app.include_router(containers.router)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    # Redirect root to the front-end
    return RedirectResponse("/static/index.html")

@app.on_event("startup")
def seed():
    """Safer seed: if no containers, create a 9×9 and its cells. If containers exist but any has zero cells, create its cells."""
    db: Session = SessionLocal()
    try:
        containers_count = db.query(models.Container).count()
        if containers_count == 0:
            c = models.Container(name="Cryo Box · 9×9", type="BOX", rows=9, cols=9)
            db.add(c)
            db.flush()
            n=1
            for r in range(1,10):
                for col in range(1,10):
                    db.add(models.Cell(container_id=c.id, row=r, col=col, status='EMPTY', sample_id=str(n)))
                    n += 1
            db.commit()
        else:
            # Ensure each container has its cells
            for c in db.query(models.Container).all():
                cell_count = db.query(models.Cell).filter(models.Cell.container_id==c.id).count()
                if cell_count == 0:
                    n=1
                    for r in range(1, c.rows+1):
                        for col in range(1, c.cols+1):
                            db.add(models.Cell(container_id=c.id, row=r, col=col, status='EMPTY', sample_id=str(n)))
                            n += 1
                    db.commit()
    finally:
        db.close()
