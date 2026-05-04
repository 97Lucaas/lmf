import json
import codecs

data_array = []
questionnb = 1
actual_q = ""
actual_r = ""

with codecs.open('in_data.txt', 'r', encoding="utf8") as f:
    for line in f:
        if '?' in line:
            actual_q = line.replace('\n', '').replace('\r', '')
        elif actual_q and not '?' in line:
            actual_r = line.replace('\n', '').replace('\r', '')
        if actual_q and actual_r:
            #data_array.append([["question",f"{actual_q}"],["reponse",f"{actual_r}"],["level",0]])
            data_array.append({"ID":questionnb,"question":f"{actual_q}","reponse":f"{actual_r}","level":0})
            questionnb = questionnb + 1
    



with codecs.open('datacopy.json', 'w', encoding="utf8") as fl:
   json.dump(data_array, fl, ensure_ascii=False)