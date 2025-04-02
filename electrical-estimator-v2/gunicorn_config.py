import os

workers = 2
threads = 4
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"