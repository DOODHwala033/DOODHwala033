import subprocess,re,json,numpy as np,wave
SR=24000
o=subprocess.run(['ffmpeg','-i','vo_raw.wav','-af','silencedetect=noise=-38dB:d=0.15','-f','null','-'],capture_output=True,text=True).stderr
st=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',o)]; en=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',o)]
D=75.12; segs=[];cur=0.0
for s,e in zip(st,en):
    if s-cur>0.05: segs.append((cur,s))
    cur=e
if D-cur>0.05: segs.append((cur,D))
assert len(segs)==40,len(segs)
TXT=["Churel Rakshak.","La Llorona","Khauf.","Par asli shikaar kaun?","Raat ke do baje.","Tum dhundh bhare nadi kinare akele ho.","Door se rona sunai deta hai —","¡Ay, mis","hijos!","La Llorona apne bachchon ko dhoondhti hai.","Kayi kahaniyon mein,","uska rona door lage,","toh woh paas hoti hai.","Tum peeche hatte ho,","par pair paani ki taraf badhte hain.","Safed, bheegi poshaak wala saaya paani se uthta hai.","Aansuon bhara chehra haath badhata hai —","Mere bachche...","Pale-hari roshni chamakti hai.","Churel La Llorona ke saamne aa khadi hoti hai.","Paani tham jaata hai.","La Llorona sama jaati hai.","Lekin Churel ki nazar us par nahi...","tum par tiki rehti hai.","Tum samajhte ho bach gaye.","Churel mudti hai.","Uske pair...","ulte hain.","Woh muskurati hai:","La Llorona se bachaya tumhe...","","tum mera shikaar ho.","Toh kisne bachaya,","aur kisne shikaar chuna?","Comment karo —","CHUREL","ya LA LLORONA?","Agla muqabla —","VETALA","ya SLENDERMAN?"]
# seg 30 is a 0.23s fragment inside "La Llorona se bachaya tumhe... ab" -> merge into seg 31 text
TXT[31]="ab tum mera shikaar ho."
BEAT_END={3,8,12,23,31,39}
KEEP={17:0.70,20:0.60,22:0.65,26:0.50,27:0.70,29:0.40,7:0.12,1:0.12,0:0.14,2:0.30,30:0.05}  # gap AFTER segment i (s)
def gap_after(i,g):
    if i in BEAT_END: return 0.46
    if i in KEEP: return min(g,KEEP[i])
    return min(g,0.30)*0.55
y=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i','vo_raw.wav','-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True).stdout,np.float32)
out=[np.zeros(int(0.2*SR),np.float32)];t=0.2;timing=[];beat_start={}
bidx=0;beats=[[0,3],[4,8],[9,12],[13,23],[24,31],[32,39]]
for i,(a,b) in enumerate(segs):
    pad=0.03
    x=y[int(max(0,a-pad)*SR):int(min(D,b+pad)*SR)].copy(); n=len(x)
    f=int(0.012*SR); x[:f]*=np.linspace(0,1,f); x[-f:]*=np.linspace(1,0,f)
    d=n/SR; timing.append({'i':i,'text':TXT[i],'s':round(t,3),'e':round(t+d,3)})
    g=(segs[i+1][0]-b) if i+1<len(segs) else 0
    ga=gap_after(i,g) if i<len(segs)-1 else 0.45
    out+= [x,np.zeros(int(ga*SR),np.float32)]; t+=d+ga
v=np.concatenate(out); pk=np.abs(v).max(); v=v*(0.93/pk) if pk>0.93 else v
with wave.open('voice.wav','wb') as w: w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(v,-1,1)*32767).astype(np.int16).tobytes())
subprocess.run(['ffmpeg','-v','error','-y','-i','voice.wav','-ar','48000','-ac','1','-b:a','192k','voice.mp3'],check=True)
bs=[]
for k,(a,b) in enumerate(beats):
    s=timing[a]['s']; e=timing[b]['e']; bs.append({'beat':k+1,'s':s,'e':e})
json.dump({'duration':len(v)/SR,'segs':timing,'beats':bs},open('timing.json','w'),indent=1,ensure_ascii=False)
print('VO duration',round(len(v)/SR,2)); [print(b) for b in bs]
