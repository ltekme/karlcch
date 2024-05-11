from dotenv import dotenv_values
import os
from flask_frozen import Freezer
from app import app


basedir = os.path.dirname(__file__)

build_config = dict(dotenv_values('.buildenv'))

if __name__ == '__main__':
    app.config.from_mapping(build_config)
    app.config["FREEZER_DESTINATION"] = build_config.get('BUILD_DESTINATION') or os.path.join(basedir, '.build')
    freezer = Freezer(app)
    freezer.freeze()
