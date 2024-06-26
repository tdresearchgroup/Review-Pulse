import pandas as pd
from time import sleep
from google_play_scraper import app, Sort, reviews_all

def get_reviews(app_id):
    result = reviews_all(
        app_id,
        sleep_milliseconds=0, # defaults to 0
        lang='en', # defaults to 'en'
        country='us' # defaults to 'us'
    )
    reviews = pd.DataFrame(result)
    reviews.to_json('reviews.json', orient='records')
    return

if __name__ == '__main__':
    app_id = ''
    get_reviews(app_id)