from flask import Flask
from flask_sitemapper import Sitemapper

app = Flask(__name__)

sitemapper = Sitemapper(https=bool(app.config.get("URL_SCHEME") == "https"))
sitemapper.init_app(app)

# routes must be placed at the bottom
from . import routes

