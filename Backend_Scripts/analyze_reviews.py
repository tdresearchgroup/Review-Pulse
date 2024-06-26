from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from googleapiclient import discovery
import pandas as pd
from time import sleep

API_KEY = 'YOUR_API_KEY'

def get_sentiment():
    reviews = pd.read_json('reviews.json')
    analyzer = SentimentIntensityAnalyzer()
    reviews['sentiment'] = reviews['content'].apply(
        lambda x: analyzer.polarity_scores(x)['compound']
    )
    reviews.to_json('reviews.json', orient='records')
    return

def get_toxicity():
    client = discovery.build('commentanalyzer',
                            'v1alpha1',
                            developerKey=API_KEY,
                            discoveryServiceUrl='https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1',
                            static_discovery=False
                            )
    reviews = pd.read_json('reviews.json')
    toxicity = []
    for review in reviews['content']:
        try:
            analyze_request = {
                'comment': {'text': review},
                'requestedAttributes': {'TOXICITY': {}}
            }
            response = client.comments().analyze(body=analyze_request).execute()
            toxicity.append(response['attributeScores']['TOXICITY']['summaryScore']['value'])
            sleep(1)
        except Exception as e:
            toxicity.append(None)

    reviews['toxicity'] = toxicity
    reviews.to_json('reviews.json', orient='records')

if __name__ == '__main__':
    get_sentiment()
    get_toxicity()


