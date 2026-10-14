 'use client';
import {useState} from 'react';
import {Megaphone,Pause,Play} from 'lucide-react';
import type {News} from '@/lib/dashboard';
export default function NewsBanner({news}:{news:News}){
 const [paused,setPaused]=useState(false);
 if(!news.enabled||!news.text.trim())return null;
 if(news.mode==='static')return <section className="club-news" aria-label="Club-News"><Megaphone size={24}/><div>{news.title&&<h2>{news.title}</h2>}<p>{news.text}</p></div></section>;
 return <section className={'news-ticker'+(paused?' is-paused':'')} aria-label="Club-News"><Megaphone size={21} aria-hidden="true"/><div className="ticker-window"><p className="ticker-copy" style={{animationPlayState:paused?'paused':'running',animationDuration:Math.max(25,news.text.length/6)+'s'}}>{news.title&&<strong>{news.title} · </strong>}{news.text}</p></div><button className="ticker-control" type="button" onClick={()=>setPaused(!paused)} aria-label={paused?'Laufschrift fortsetzen':'Laufschrift pausieren'} title={paused?'Laufschrift fortsetzen':'Laufschrift pausieren'}>{paused?<Play size={19}/>:<Pause size={19}/>}</button></section>
}
