#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Nov 22 17:04:02 2020

@author: stevepeters
"""
from datetime import datetime
import pandas as pd
from urllib.request import urlopen
from bs4 import BeautifulSoup
import os
import re

def gnp( url  ): # get list of committees
    html_sc= urlopen(url)
    soup = BeautifulSoup(html_sc, features="html.parser") 
    
    # process committees in current page
    clist=soup.find_all("a", {"class": "card-committee"})
    for tc in clist:
        tl=tc['href']
        isOld=tl.find('old.parliament')
        if isOld==-1:
            print( tc )
            ct=tl.replace("/committee/","")
            cid=int(ct[:ct.find('/')])
            tr={'id': cid, 'url': "https://committees.parliament.uk"  +  tl}
            list_cpage.append( tr )
       
    
    # look for next page of committees
    hasnp=soup.find('a', href=True, title="Go to next page")
    if hasnp != None:        
        nextref="https://committees.parliament.uk" + hasnp['href']
        gnp( nextref )
        
    else:
        proc_cpage(cid, tlid)


def proc_cpage(cid, tlid): # process list of committees
    a=1
   
    for l in list_cpage:
       # if a<=2:
            
        # open committee landing page
        html_cp= urlopen(l['url'])
       
        soup_c = BeautifulSoup(html_cp, features="html.parser") 
        role_c=soup_c.find('div',{'class':'reading-width'})
        if role_c != None:
            
            role_c=role_c.getText()
            role_c=' '.join([line.strip() for line in role_c.strip().splitlines() if line.strip()])
        
        l['ctitle']=soup_c.find('h1').getText()
        l['cclass']=soup_c.find('h2').getText()
        l['crole']=role_c
        l['logged_on']=log_time
        
        #get members
        getCMembers( l['url'] + 'membership/', l['id'],  l['ctitle'], tlid)
            
        a=a+1
    html_cp=None 

def getCMembers( tl, cid, ct, tlid ) :
    print( ct )
    html_cm= urlopen(tl)
    soup_cm = BeautifulSoup(html_cm, features="html.parser") 
    list_m = soup_cm.findAll("div", {"class": "card-inner"})
    
    for md in list_m:
        
        # check if member is chair person
        cpos=''
        p_cl=''
        pos_chair = cd(md.find("span", {"class":"fa-chair"}))
        if pos_chair !=None:
            cpos='Chair'
        else:
            cpos=''
        
        # get person details
        p_name = cd(md.find("div", {"class":"primary-info"}))
        p_party = cd(md.find("div", {"class":"secondary-info"}))
        p_const = cd(md.find("div", {"class":"indicator-label"}))
        p_cl=p_const.lower()
        p_img = md.find("div", {"class":"image"})
        p_iurl=p_img['style'].split('(')[1].split(')')[0]
        if p_cl != "lay member":
            epos=p_iurl.find('/Thumb',0);
            if epos==-1:
                epos=p_iurl.find('.jpg',0) 
                if epos==-1:
                    pause=True
            p_iurl=p_iurl[:epos]
            p_idpos=p_iurl.rfind('/')
            m_id=int(p_iurl[p_idpos+1:])
        if p_cl=="lay member":
            m_id=80000+tlid
            tlid=tlid+1
            p_iurl=None
       
        
        tcr={'id': cid, 'memberid': m_id, 'logged_on': log_time}
        list_cmembers.append(tcr)
        list_people[m_id]= {    
            'name':p_name,
            'role':cpos,
            'party':p_party,
            'const':p_const,
            'img':p_iurl,
            'logged_on': log_time
        }
    html_cm=None
    
def cd( e ):
    rv=None
    if e != None:
        rv=e.getText().strip()
    return rv
    
tfs='%Y-%m-%d'
url="https://committees.parliament.uk/committees/?SearchTerm=&House=Any&Active=Current"
list_cpage=[]
list_cmembers=[]
list_people={}
log_time=datetime.now().strftime(tfs)
aroot="D:/parlicomm/"
tlid=1

# load previous run and check if data needs updating
try:
    df_prev=pd.read_csv('data/c_committees.json')
    date_prev=datetime.strptime(df_prev.iloc[0]['logged_on'],tfs )
except:
    date_prev=datetime.strptime('2020-01-01',tfs )

if datetime.now() > date_prev:
   
    # rename files from previous run
    if "a"=="b":
        ptl=date_prev.strftime(tfs)
        try:
            os.rename(aroot + 'data/c_members.json',aroot + 'data/'+ ptl + '_c_members.json')
        except:
            os.remove(aroot + 'data/' + ptl + '_c_members.json')
            os.rename(aroot + 'data/c_members.json',aroot + 'data/'+  ptl + '_c_members.json')
            
        try:
            os.rename(aroot + 'data/c_committees.json',aroot + 'data/'+ ptl + '_c_committees.json')
        except:
            os.remove(aroot + 'data/'+ ptl + '_c_committees.json')
            os.rename(aroot + 'data/c_committees.json',aroot + 'data/'+ ptl + '_c_committees.json')
        
        try:
            os.rename(aroot + 'data/c_people.json',aroot + 'data/'+ ptl + '_c_people.json')
        except:
            os.remove(aroot + 'data/'+ ptl + '_c_people.json')
            os.rename(aroot + 'data/c_people.json',aroot + 'data/'+ ptl + '_c_people.json')
    
    # process data
    gnp( url  )
    df_cmembers=pd.DataFrame(list_cmembers)
    df_committees=pd.DataFrame( list_cpage )
    df_people=pd.DataFrame.from_dict(list_people, orient='index')
    df_cmembers.to_json(path_or_buf=aroot + 'data/c_members.json', orient="table")
    df_committees.to_json(path_or_buf=aroot + 'data/c_committees.json', orient="table")
    df_people.index.name='memberid'
    df_people.to_json(path_or_buf=aroot + 'data/c_people.json', orient="table")


    
