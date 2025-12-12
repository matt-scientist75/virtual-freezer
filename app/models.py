
from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base

class Container(Base):
    __tablename__ = 'containers'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    rows = Column(Integer, nullable=False)
    cols = Column(Integer, nullable=False)
    cells = relationship("Cell", back_populates="container", cascade="all, delete-orphan")

class Cell(Base):
    __tablename__ = 'cells'
    id = Column(Integer, primary_key=True, index=True)
    container_id = Column(Integer, ForeignKey('containers.id'), nullable=False, index=True)
    row = Column(Integer, nullable=False)
    col = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default='EMPTY')
    vial_name = Column(String, nullable=True)
    owner = Column(String, nullable=True)
    project = Column(String, nullable=True)
    container = relationship("Container", back_populates="cells")
    __table_args__ = (UniqueConstraint('container_id', 'row', 'col', name='uq_cell_position'),)
