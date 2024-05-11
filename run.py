from app import app

dev_config = {
    "TESTING": True,
    "DEBUG": False,
    "SERVER_NAME": None,
    "URL_SCHEME": None,
    "URL_EXTERNAL": False
}

if __name__ == '__main__':
    app.config.update(**dev_config)
    app.run(host='0.0.0.0')

