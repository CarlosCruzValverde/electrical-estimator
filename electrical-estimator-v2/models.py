from database import db
from sqlalchemy.sql.expression import text
from sqlalchemy.sql.sqltypes import TIMESTAMP


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    email = db.Column(db.String(32), unique=True, nullable=False)
    username = db.Column(db.String(32), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(TIMESTAMP, nullable=False, server_default=text('now()'))

    # One-to-many relationship: One User -> Many Projects
    projects = db.relationship('Project', backref='user', lazy='dynamic')


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    address = db.Column(db.String(64), nullable=False)
    company = db.Column(db.String(64))
    start_date = db.Column(db.Date, nullable=False)
    p_type = db.Column(db.String(64))
    status = db.Column(db.String(32), nullable=False, default="started")  # Track the status
    created_at = db.Column(TIMESTAMP, nullable=False, server_default=text('now()'))

    # Relationships
    cost_estimations = db.relationship('CostEstimation', backref='project', lazy='dynamic')
    misc_equipment_estimations = db.relationship('MiscEquipmentEstimation', backref='project', lazy='dynamic')
    labor_cost_estimations = db.relationship('LaborCostEstimation', backref='project', lazy='dynamic')
    summaries = db.relationship('ProjectSummary', backref='project', lazy='dynamic')

    # Foreign key to User
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"), nullable=False, index=True)


class CostEstimation(db.Model):
    __tablename__ = "cost_estimations"

    id = db.Column(db.Integer, primary_key=True)
    tax_percentage = db.Column(db.Float)
    tax_amount = db.Column(db.Float)
    grand_total = db.Column(db.Float)
    awg_total = db.Column(db.Float)  # New field for AWG total
    conduit_total = db.Column(db.Float)  # New field for Conduit total
    created_at = db.Column(TIMESTAMP, nullable=False, server_default=text('now()'))

    # Foreign key to Project
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete="CASCADE"), nullable=False, index=True)
    # One-to-many: One CostEstimation -> Many EstimationEntries
    entries = db.relationship("EstimationEntry", backref="cost_estimation", cascade="all, delete-orphan")


class EstimationEntry(db.Model):
    __tablename__ = "estimation_entries"

    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50))  # "AWG" or "Conduit"
    name = db.Column(db.String(50))  # e.g., "AWG 10", "1/2 Conduit"
    cost = db.Column(db.Float, default=0.0)
    length = db.Column(db.Float, default=0.0)
    subtotal = db.Column(db.Float, default=0.0)
    notes_awg = db.Column(db.String(300))
    notes_conduit = db.Column(db.String(300))
    created_at = db.Column(TIMESTAMP, nullable=False, server_default=text('now()'))

    cost_estimation_id = db.Column(db.Integer, db.ForeignKey("cost_estimations.id", ondelete="CASCADE"), nullable=False, index=True)

    def __repr__(self):
        return f"<EstimationEntry {self.id}>"


class MiscEquipmentEstimation(db.Model):
    __tablename__ = "misc_equipment_estimations"

    id = db.Column(db.Integer, primary_key=True)
    tax_percentage = db.Column(db.Float)
    tax_amount = db.Column(db.Float)
    grand_total = db.Column(db.Float)
    misc_total = db.Column(db.Float)  # New field for Miscellaneous total
    equipment_total = db.Column(db.Float)  # New field for Equipment total
    created_at = db.Column(TIMESTAMP, nullable=False, server_default=text('now()'))
    
    # Foreign key to Project
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete="CASCADE"), nullable=False, index=True)
    # Relationship to store miscellaneous and equipment entries
    entries = db.relationship("MiscEquipmentEntry", backref="misc_equipment_estimation", cascade="all, delete-orphan")


class MiscEquipmentEntry(db.Model):
    __tablename__ = "misc_equipment_entries"

    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50))  # "Miscellaneous" or "Equipment"
    name = db.Column(db.String(50))  # e.g., "Bollards", "Switch Board"
    cost = db.Column(db.Float)
    quantity = db.Column(db.Float)
    subtotal = db.Column(db.Float)
    notes_misc = db.Column(db.String(300))
    notes_equip = db.Column(db.String(300))
    created_at = db.Column(TIMESTAMP, nullable=False, server_default=text('now()'))

    misc_equipment_estimation_id = db.Column(db.Integer, db.ForeignKey("misc_equipment_estimations.id", ondelete="CASCADE"), nullable=False)

    def __repr__(self):
        return f"<MiscEquipmentEntry {self.id}>"
    

class LaborCostEstimation(db.Model):
    __tablename__ = "labor_cost_estimations"

    id = db.Column(db.Integer, primary_key=True)
    chargers_count = db.Column(db.Integer)
    charger_price = db.Column(db.Float)
    labor_total = db.Column(db.Float)  # New field for Labor total
    low_voltage_total = db.Column(db.Float)  # New field for Low Voltage total
    grand_total = db.Column(db.Float)
    created_at = db.Column(TIMESTAMP, nullable=False, server_default=text('now()'))
    
    # Foreign key to Project
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete="CASCADE"), nullable=False, index=True)
    # Relationship to store labor entries
    entries = db.relationship("LaborCostEntry", backref="labor_cost_estimation", cascade="all, delete-orphan")


class LaborCostEntry(db.Model):
    __tablename__ = "labor_cost_entries"

    id = db.Column(db.Integer, primary_key=True)
    position = db.Column(db.String(50))  # e.g., "Project Manager", "Journeyman Wireman"
    rate = db.Column(db.Float)          # Hourly rate
    workers = db.Column(db.Integer)     # Number of workers
    hours = db.Column(db.Float)         # Hours per day
    days = db.Column(db.Float)          # Number of working days
    subtotal = db.Column(db.Float)      # Calculated subtotal
    notes = db.Column(db.String(300))   # Optional notes
    created_at = db.Column(TIMESTAMP, nullable=False, server_default=text('now()'))

    labor_cost_estimation_id = db.Column(db.Integer, db.ForeignKey("labor_cost_estimations.id", ondelete="CASCADE"), nullable=False)

    def __repr__(self):
        return f"<LaborCostEntry {self.id}>"


class ProjectSummary(db.Model):
    __tablename__ = "project_summaries"

    id = db.Column(db.Integer, primary_key=True)
    # AWG Fields
    awg_base_cost = db.Column(db.Float, default=0.0)
    awg_markup = db.Column(db.Float, default=1.0)
    awg_subtotal = db.Column(db.Float, default=0.0)
    awg_profit = db.Column(db.Float, default=0.0)
    
    # Conduit Fields
    conduit_base_cost = db.Column(db.Float, default=0.0)
    conduit_markup = db.Column(db.Float, default=1.0)
    conduit_subtotal = db.Column(db.Float, default=0.0)
    conduit_profit = db.Column(db.Float, default=0.0)
    
    # Miscellaneous Fields
    misc_base_cost = db.Column(db.Float, default=0.0)
    misc_markup = db.Column(db.Float, default=1.0)
    misc_subtotal = db.Column(db.Float, default=0.0)
    misc_profit = db.Column(db.Float, default=0.0)
    
    # Equipment Fields
    equipment_base_cost = db.Column(db.Float, default=0.0)
    equipment_markup = db.Column(db.Float, default=1.0)
    equipment_subtotal = db.Column(db.Float, default=0.0)
    equipment_profit = db.Column(db.Float, default=0.0)
    
    # Labor Fields
    labor_base_cost = db.Column(db.Float, default=0.0)
    labor_markup = db.Column(db.Float, default=1.0)
    labor_subtotal = db.Column(db.Float, default=0.0)
    labor_profit = db.Column(db.Float, default=0.0)
    
    # Low Voltage Fields
    low_voltage_base_cost = db.Column(db.Float, default=0.0)
    low_voltage_markup = db.Column(db.Float, default=1.0)
    low_voltage_subtotal = db.Column(db.Float, default=0.0)
    low_voltage_profit = db.Column(db.Float, default=0.0)
    
    # Permits Fields
    permits_base_cost = db.Column(db.Float, default=0.0)
    permits_markup = db.Column(db.Float, default=1.0)
    permits_subtotal = db.Column(db.Float, default=0.0)
    permits_profit = db.Column(db.Float, default=0.0)
    
    # Income Tax Fields
    tax_base_cost = db.Column(db.Float, default=0.0)
    tax_percentage = db.Column(db.Float, default=0.0)
    tax_subtotal = db.Column(db.Float, default=0.0)
    
    # Overhead Fields
    overhead_base_cost = db.Column(db.Float, default=0.0)
    overhead_percentage = db.Column(db.Float, default=0.0)
    overhead_subtotal = db.Column(db.Float, default=0.0)
    
    # Totals
    grand_subtotal = db.Column(db.Float, default=0.0)
    grand_total = db.Column(db.Float, default=0.0)
    
    # Charger Information
    price_per_charger = db.Column(db.Float, default=0.0)
    
    # Approval
    approved = db.Column(db.Boolean, nullable=True)

    # Amounts
    total_submitted = db.Column(db.Float, default=0.0)
    approved_amount = db.Column(db.Float, default=0.0)
    
    # Notes
    notes = db.Column(db.Text)
    
    # Timestamp
    created_at = db.Column(TIMESTAMP, nullable=False, server_default=text('now()'))
    updated_at = db.Column(db.DateTime, nullable=False, server_default=db.func.now(), onupdate=db.func.now())

    # Foreign key to Project
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete="CASCADE"), nullable=False, index=True)