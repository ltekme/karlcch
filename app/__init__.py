import os
from flask import Flask
from flask_sitemapper import Sitemapper

app = Flask(__name__)

sitemapper = Sitemapper()
sitemapper.init_app(app)


class config:
    _svr_nme = os.environ.get('SERVER_NAME')
    if _svr_nme:
        SERVER_NAME = _svr_nme


app.config.from_object(config)

from . import routes

