import pandas as pd
from openai import OpenAI
import ast
from time import sleep

client = OpenAI(
    api_key = "YOUR_API_KEY"
)

def get_category(review):
    response = client.chat.completions.create(
        model="ft:gpt-3.5-turbo-1106:personal:omar:94zYyYEY",
        messages=[
            {
                "role": "user",
                "content": f"For the following review: {review} , extract any of these labels in the review:  Crashing Issues, UI / Design Issues, Performance Issues, Functionality Issues, User Experience Issues, Developer Related Issues, Security Related Issues. return the start and end index of the label in the review."
            },
        ]
        ,
        seed=69,
        max_tokens=100,
        temperature=0,
    )

    return response

def convert_labels_to_list(labels):
    try:
        return ast.literal_eval(labels)
    except Exception as e:
        return []
    
def merge_labels(labels):
    # merge consecutive labels of the same type into one
    if not labels or len(labels) == 0:
        return []
    
    merged_list = []
    current_start, current_end, current_type = labels[0]

    for item in labels[1:]:
        start, end, item_type = item
        if item_type == current_type and start == current_end + 1:
            # Merge consecutive items of the same type
            current_end = end
        else:
            # Append the merged item to the result list
            merged_list.append([current_start, current_end, current_type])
            # Start a new item
            current_start, current_end, current_type = start, end, item_type

    # Append the last merged item
    merged_list.append([current_start, current_end, current_type])

    return merged_list

def label_reviews():
    reviews = pd.read_json('reviews.json')
    labels = []
    for review in reviews['content']:
        try:
            response = get_category(review)
            labels.append(response['choices'][0]['message']['content'])
        except Exception as e:
            labels.append(None)

        if len(labels) % 100 == 0:
            sleep(60)

    reviews['labels'] = labels
    reviews['labels'] = reviews['labels'].apply(convert_labels_to_list)
    reviews['labels'] = reviews['labels'].apply(merge_labels)
    reviews.to_json('reviews.json', orient='records')

if __name__ == '__main__':
    label_reviews()