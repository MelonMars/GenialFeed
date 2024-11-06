import numpy as np
import json
import nltk
import spacy
import gensim
from gensim.utils import simple_preprocess
from gensim.models import CoherenceModel
from nltk.corpus import stopwords
import pyLDAvis
import pyLDAvis.gensim_models
import matplotlib.pyplot as plt


def preprocess(text, stopwords):
    return [word for word in simple_preprocess(text) if word not in stopwords and len(word) > 3]


def lemma(text, allowed_postags=['NOUN', 'ADJ', 'VERB', 'ADV'], nlp=spacy.load('en_core_web_sm')):
    txtOut = []
    txtOut.append([[token.lemma_ for token in doc if token.pos_ in allowed_postags] for doc in nlp.pipe(" ".join(word) for word in text)])
    return txtOut


def tokenize(text, stopwords):
    return [word for word in gensim.utils.simple_preprocess(text) if word not in stopwords]


def main():
    data = json.load(open("links.json", "r"))
    data = list(data.keys())
    nlp = spacy.load('en_core_web_sm', disable=['parser', 'ner'])

    stop_words = stopwords.words('english')

    data = [tokenize(text, stop_words) for text in data]

    id2word = gensim.corpora.Dictionary(data)
    corpus = [id2word.doc2bow(text) for text in data]

    lda_model = gensim.models.LdaMulticore(corpus=corpus,
                                           id2word=id2word,
                                           num_topics=10,
                                           random_state=100,
                                           chunksize=100,
                                           passes=10,
                                           per_word_topics=True)

    coherence_model_lda = CoherenceModel(model=lda_model, texts=data, dictionary=id2word, coherence='c_v')
    coherence_lda = coherence_model_lda.get_coherence()
    vis = pyLDAvis.gensim_models.prepare(lda_model, corpus, id2word)
    pyLDAvis.save_html(vis, "saved.html")


if __name__ == "__main__":
    main()
