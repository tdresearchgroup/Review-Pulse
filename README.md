# [Review-Pulse](https://tdresearchgroup.github.io/Review-Pulse/dashboard/)

This repository contains the replication package and code for our ICSME 2024 tool demo submission.

## Introduction
We propose a dashboard aimed at helping developers efficiently manage and analyze app reviews. Our tool leverages machine learning to classify user feedback into specific issue types, such as Crash, Design, Performance, and Functionality. It evaluates sentiment and toxicity levels in reviews and tracks code quality over time using metrics like code smells. The dashboard features interactive visualizations and filtering options, allowing developers to explore data, prioritize issues, and assess the impact of software updates. This package includes all resources needed to replicate our study and utilize the dashboard.

![Overview of The Dashboard](https://github.com/tdresearchgroup/Review-Pulse/assets/40151410/ca1681ec-1c55-4136-b81d-67ab43e0eb71)

## Charts Images
<img width="904" alt="radar_chart" src="https://github.com/tdresearchgroup/Review-Pulse/assets/40151410/b1906459-94a4-4b71-bac5-148519586294">
<img width="1155" alt="issues_line_chart" src="https://github.com/tdresearchgroup/Review-Pulse/assets/40151410/e335b473-914c-417e-9c8f-8a20916cef3b">
<img width="1155" alt="rating_line_chart" src="https://github.com/tdresearchgroup/Review-Pulse/assets/40151410/0c8afe03-5290-4fd0-94f2-9609d1795b13">
<img width="1155" alt="package_smells_line_chart" src="https://github.com/tdresearchgroup/Review-Pulse/assets/40151410/a9631bf5-03bf-433f-bb2e-7de825be0266">

## Replication Package Structure

- **Backend_Scripts**: Contains scripts for collecting, analyzing, and labeling reviews, and extracting code smells. This is the backbone of the dashboard.
- **Model Training**: Includes datasets for training and testing the model and a notebook for data preparation.
- **Survey Questions and Responses.xlsx**: Contains survey questions and participant responses.
- **dashboard**: Holds the frontend files, including HTML, CSS, and JavaScript for the dashboard interface.


```
├── Backend_Scripts
│   ├── analyze_reviews.py
│   ├── app.py
│   ├── collect_reviews.py
│   ├── extract_code_smells.py
│   ├── get_releases.py
│   ├── label_reviews.py
│   └── reviews.json
├── Model Training
│   ├── LABELLED_REVIEWS.jsonl
│   ├── gpt_test.jsonl
│   ├── gpt_train.jsonl
│   └── perp_data.ipynb
├── README.md
├── Survey Questions and Responses.xlsx
└── dashboard
    ├── Applications_Reviews.json
    ├── data.json
    ├── favicon.ico
    ├── index.html
    ├── script.js
    └── style.css
```
