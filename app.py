import os
from dotenv import load_dotenv
load_dotenv() # Carga variables del archivo .env
from flask import Flask
from flask_cors import CORS
from routes.auth import auth_bp
from routes.pagos import pagos_bp
from routes.admin import admin_bp
from routes.reports import reports_bp

app = Flask(__name__)
app.config.from_object('config')
CORS(app)
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(pagos_bp, url_prefix='/api/pagos')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(reports_bp, url_prefix='/api/reports')

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)