"""Utility helpers for audio pipeline."""


def is_chinese_char(c):
    return '\u4e00' <= c <= '\u9fff'


def is_chinese_word(word):
    return all(is_chinese_char(c) for c in word)


def is_english_word(word):
    return all(c.isascii() and c.isalpha() for c in word)
