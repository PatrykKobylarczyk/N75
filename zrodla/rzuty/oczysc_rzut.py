import sys, math, collections
from pypdf import PdfWriter
from pypdf.generic import ContentStream
"""Czyści rzut parteru z PDF projektu budowlanego: usuwa teksty, kolorowe linie ppoż., linie kreskowe, osie i opisy.
Użycie: python3 oczysc_rzut.py wejscie.pdf wyjscie.pdf  (potem render pdftoppm i skala 1,5081 px/pt, jak pietro-0.webp)"""
SRC, DST = sys.argv[1], sys.argv[2]
H=1683.72
OX,OY=-1062.96,-841.86
BX0,BX1=352.0+OX,1250.5+OX; BY0,BY1=H-1379.5+OY,H-291.0+OY
def inb(p,t=3): return BX0-t<=p[0]<=BX1+t and BY0-t<=p[1]<=BY1+t
w=PdfWriter(clone_from=SRC); pg=w.pages[0]
cs=ContentStream(pg.get_contents(), w)
PATH={b'm',b'l',b'c',b'v',b'y',b'h',b're'}
PAINT={b'S',b's',b'f',b'F',b'f*',b'B',b'B*',b'b',b'b*'}
def gray(c): return max(c)-min(c)<.05 and max(c)<=0.1
# 1. zbierz ścieżki
items=[]; buf=[]; sc=(0,0,0); fc=(0,0,0); intext=False; stack=[]
for ops,op in cs.operations:
    if op==b'BT': intext=True; continue
    if op==b'ET': intext=False; continue
    if intext: continue
    if op==b'RG': sc=tuple(float(x) for x in ops)
    if op==b'rg': fc=tuple(float(x) for x in ops)
    if op==b'q': stack.append((sc,fc))
    if op==b'Q': sc,fc=stack.pop()
    if op in PATH: buf.append((ops,op)); continue
    if op in PAINT:
        items.append(['P',buf,(ops,op),sc,fc]); buf=[]; continue
    if op==b'Do': continue
    items.append(['O',(ops,op)])
# 2. decyzje
segs=[]
for i,it in enumerate(items):
    if it[0]!='P': continue
    buf,(o,op),sc,fc=it[1],it[2],it[3],it[4]
    keep = gray(fc) if op in (b'f',b'F',b'f*') else gray(sc)
    pts=[[float(x) for x in a] for a,k in buf if k in (b'm',b'l')]
    if keep and pts and not all(inb(p) for p in pts): keep=False
    it.append(keep)
    if keep and pts:
        xs=[p[0] for p in pts]; ys=[p[1] for p in pts]; bw=max(xs)-min(xs); bh=max(ys)-min(ys)
        # osie: długie linie przecinające budynek z dala od elewacji
        if op==b'S' and len(pts)==2:
            if bw>0.45*(BX1-BX0) and bh<0.5 and min(abs(ys[0]-BY0),abs(ys[0]-BY1))>6: keep=False
            if bh>0.45*(BY1-BY0) and bw<0.5 and min(abs(xs[0]-BX0),abs(xs[0]-BX1))>6: keep=False
        # ramki opisów: małe prostokąty
        if op==b'S' and len(pts)>=4 and max(bw,bh)<45 and min(bw,bh)<9 and max(bw,bh)/max(min(bw,bh),.1)>2.2 and abs(pts[0][0]-pts[-1][0])<.3 and abs(pts[0][1]-pts[-1][1])<.3: keep=False
        if op in (b'f',b'F') and max(bw,bh)<3.2: keep=False
        it[5]=keep
    if keep and op==b'S' and len(buf)==2 and buf[1][1]==b'l':
        a,b=pts; L=math.dist(a,b)
        if L<=14: segs.append((i,a,b,L))
# wykrywanie kresek: współliniowe krótkie odcinki z przerwami
grp=collections.defaultdict(list)
for i,a,b,L in segs:
    th=math.atan2(b[1]-a[1],b[0]-a[0])%math.pi
    if th>math.pi-0.01: th-=math.pi
    rho=a[0]*math.sin(th)-a[1]*math.cos(th)
    t0=a[0]*math.cos(th)+a[1]*math.sin(th); t1=b[0]*math.cos(th)+b[1]*math.sin(th)
    grp[(round(th*100),round(rho/0.4))].append((min(t0,t1),max(t0,t1),i))
dash=set()
for k,v in grp.items():
    v.sort()
    for j in range(len(v)-1):
        g=v[j+1][0]-v[j][1]
        if 0.4<g<14: dash.add(v[j][2]); dash.add(v[j+1][2])
# osie: odcinki poziome/pionowe na jednej prostej pokrywające większość budynku
ax=collections.defaultdict(list)
for i,it in enumerate(items):
    if it[0]!='P' or not it[5] or it[2][1]!=b'S' or len(it[1])!=2: continue
    (a,_),(b,_)=it[1]; a=[float(x) for x in a]; b=[float(x) for x in b]
    if abs(a[1]-b[1])<.05: ax[('h',round(a[1],1))].append((min(a[0],b[0]),max(a[0],b[0]),i))
    elif abs(a[0]-b[0])<.05: ax[('v',round(a[0],1))].append((min(a[1],b[1]),max(a[1],b[1]),i))
axn=0
for (d,c),v in ax.items():
    cov=sum(x[1]-x[0] for x in v); ext=(BX1-BX0) if d=='h' else (BY1-BY0)
    edge=min(abs(c-BY0),abs(c-BY1)) if d=='h' else min(abs(c-BX0),abs(c-BX1))
    if cov>0.62*ext and edge>6:
        for x in v: dash.add(x[2]); axn+=1
print('axis segs',axn)
# elementy przy opisach (ramki etykiet, znaczniki rzędnych)
from pypdf import PdfReader
import math as _m
T=[]
def _v(text,cm,tm,fd,fs):
    if text.strip(): T.append((text.strip(),tm))
PdfReader(SRC).pages[0].extract_text(visitor_text=_v)
boxes=[]
for text,tm in T:
    a,b,c,d,e,f=tm; sz=_m.hypot(a,b); L=len(text)*0.55*sz
    ux,uy=a/sz,b/sz  # kierunek tekstu
    corners=[(e,f),(e+ux*L,f+uy*L),(e-uy*sz,f+ux*sz),(e+ux*L-uy*sz,f+uy*L+ux*sz)]
    xs=[p[0] for p in corners]; ys=[p[1] for p in corners]
    import re as _re
    if _re.fullmatch(r'[A-Z]{1,2}\.0\.\d', text): mx,my,lim=18,11,60
    elif text[:1] in '+-' and 'm' in text: mx,my,lim=18,14,22
    else: continue
    boxes.append((min(xs)-mx,max(xs)+mx,min(ys)-my,max(ys)+my,lim))
def inbox(b,pts): return all(b[0]<=p[0]<=b[1] and b[2]<=p[1]<=b[3] for p in pts)
tn=0
for i,it in enumerate(items):
    if it[0]!='P' or not it[5] or i in dash: continue
    pts=[[float(x) for x in a] for a,k in it[1] if k in (b'm',b'l')]
    xs=[p[0] for p in pts]; ys=[p[1] for p in pts]
    if pts and any(max(max(xs)-min(xs),max(ys)-min(ys))<b[4] and inbox(b,pts) for b in boxes): dash.add(i); tn+=1
print('near text',tn)
out=[]
for i,it in enumerate(items):
    if it[0]=='O': out.append(it[1]); continue
    if it[5] and i not in dash: out+=it[1]; out.append(it[2])
print('paths',sum(1 for x in items if x[0]=='P'),'dash',len(dash),'kept',sum(1 for i,x in enumerate(items) if x[0]=='P' and x[5] and i not in dash))
cs.operations=out; pg.replace_contents(cs); w.write(DST)
