import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Scan(Base):
    __tablename__ = "scans"

    id = Column(String(64), primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    language = Column(String(50), nullable=False)
    scanner_name = Column(String(50), nullable=False, default="Bandit")
    scan_status = Column(String(50), nullable=False, default="COMPLETED") # COMPLETED, FAILED, UNSUPPORTED
    scan_timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), index=True)
    duration_ms = Column(Integer, default=0)
    
    total_findings = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    info_count = Column(Integer, default=0)

    # Cascade delete findings when a scan is deleted
    findings = relationship(
        "Finding",
        back_populates="scan",
        cascade="all, delete-orphan",
        order_by="Finding.start_line"
    )

class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(64), primary_key=True, index=True)
    scan_id = Column(String(64), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_id = Column(String(100), nullable=True)
    title = Column(String(255), nullable=False)
    severity = Column(String(20), nullable=False) # CRITICAL, HIGH, MEDIUM, LOW, INFO
    category = Column(String(100), nullable=True)
    file_path = Column(String(255), nullable=True)
    start_line = Column(Integer, nullable=True)
    end_line = Column(Integer, nullable=True)
    cwe = Column(String(100), nullable=True)
    confidence = Column(String(50), nullable=True)
    scanner_name = Column(String(50), nullable=True, default="Bandit")
    description = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    evidence = Column(Text, nullable=True) # secret-redacted snippet

    scan = relationship("Scan", back_populates="findings")
