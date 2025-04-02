from flask_migrate import Migrate, upgrade
from your_app_module import create_app

app = create_app()
migrate = Migrate(app, app.db)

if __name__ == '__main__':
    with app.app_context():
        upgrade()
