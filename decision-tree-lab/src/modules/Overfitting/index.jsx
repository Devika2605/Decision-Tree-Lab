import { useState, useEffect, useRef, useCallback } from 'react';

// ── Dataset ────────────────────────────────────────────────────────────────────
const INITIAL_DATA = [
  { x: 0.82, y: 0.78, label: 'High' },
  { x: 0.75, y: 0.65, label: 'High' },
  { x: 0.88, y: 0.55, label: 'High' },
  { x: 0.70, y: 0.82, label: 'High' },
  { x: 0.60, y: 0.70, label: 'Med'  },
  { x: 0.65, y: 0.48, label: 'Med'  },
  { x: 0.52, y: 0.60, label: 'Med'  },
  { x: 0.72, y: 0.38, label: 'Med'  },
  { x: 0.55, y: 0.85, label: 'Med'  },
  { x: 0.45, y: 0.42, label: 'Low'  },
  { x: 0.30, y: 0.30, label: 'Low'  },
  { x: 0.38, y: 0.55, label: 'Low'  },
  { x: 0.20, y: 0.45, label: 'Low'  },
  { x: 0.25, y: 0.20, label: 'Low'  },
  { x: 0.48, y: 0.22, label: 'Low'  },
  { x: 0.15, y: 0.75, label: 'High' },
  { x: 0.90, y: 0.15, label: 'Low'  },
  { x: 0.42, y: 0.90, label: 'High' },
];

const LABELS  = ['High', 'Med', 'Low'];
// Palette: coral-pink / violet / cyan
const L_COLOR = { High: '#ff6b9d', Med: '#a78bfa', Low: '#22d3ee' };
const L_RGB   = { High: [255,107,157], Med: [167,139,250], Low: [34,211,238] };
// Dark flat fills per region (no texture)
const L_FILL  = { High: [55,8,25], Med: [25,10,55], Low: [5,38,58] };

// ── ML Core ───────────────────────────────────────────────────────────────────
function giniArr(data) {
  const n = data.length; if (!n) return 0;
  const c = { High:0, Med:0, Low:0 };
  data.forEach(d => c[d.label]++);
  return 1 - Object.values(c).reduce((s,v) => s + (v/n)**2, 0);
}
function gain(parent, left, right) {
  const n = parent.length;
  return giniArr(parent) - (left.length/n)*giniArr(left) - (right.length/n)*giniArr(right);
}
function buildTree(data, depth, maxDepth, minSize=2) {
  if (depth >= maxDepth || data.length < minSize) {
    const c = { High:0, Med:0, Low:0 };
    data.forEach(d => c[d.label]++);
    const label = Object.entries(c).sort((a,b)=>b[1]-a[1])[0][0];
    return { leaf:true, label, counts:c, size:data.length };
  }
  let best = null;
  for (const feat of ['x','y']) {
    const vals = [...new Set(data.map(d=>d[feat]))].sort((a,b)=>a-b);
    for (let i=0; i<vals.length-1; i++) {
      const thresh = (vals[i]+vals[i+1])/2;
      const left   = data.filter(d=>d[feat]<=thresh);
      const right  = data.filter(d=>d[feat]>thresh);
      if (!left.length||!right.length) continue;
      const score = gain(data,left,right);
      if (!best||score>best.score) best={feat,thresh,left,right,score};
    }
  }
  if (!best) {
    const c={High:0,Med:0,Low:0}; data.forEach(d=>c[d.label]++);
    const label=Object.entries(c).sort((a,b)=>b[1]-a[1])[0][0];
    return{leaf:true,label,counts:c,size:data.length};
  }
  return {
    leaf:false, feat:best.feat, thresh:best.thresh, size:data.length,
    left:buildTree(best.left,depth+1,maxDepth,minSize),
    right:buildTree(best.right,depth+1,maxDepth,minSize),
  };
}
function predict(tree, pt) {
  if (tree.leaf) return tree.label;
  return pt[tree.feat]<=tree.thresh ? predict(tree.left,pt) : predict(tree.right,pt);
}
function accuracy(tree, data) {
  if (!data.length) return 0;
  return Math.round(data.filter(d=>predict(tree,d)===d.label).length/data.length*100);
}

// ── Boundary renderer ─────────────────────────────────────────────────────────
// Clean flat fills + sharp glowing edges, zero diagonal artefacts
function renderBoundary(canvas, tree, W, H) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  const buf = img.data;

  const STEP = 2;
  const lmap = new Uint8Array(W * H);
  const li   = { High:0, Med:1, Low:2 };
  const fillArr = [L_FILL.High, L_FILL.Med, L_FILL.Low];
  const edgeArr = [L_RGB.High,  L_RGB.Med,  L_RGB.Low ];

  // Classify
  for (let py = 0; py < H; py += STEP) {
    for (let px = 0; px < W; px += STEP) {
      const v = li[predict(tree, { x: px/W, y: 1-py/H })];
      for (let dy = 0; dy < STEP && py+dy < H; dy++)
        for (let dx = 0; dx < STEP && px+dx < W; dx++)
          lmap[(py+dy)*W + (px+dx)] = v;
    }
  }

  // Fill pixels — flat colour, edge pixels get bright edge colour
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const m = lmap[py*W + px];
      const i = (py*W + px) * 4;
      const onEdge =
        (py > 0   && lmap[(py-1)*W+px] !== m) ||
        (py < H-1 && lmap[(py+1)*W+px] !== m) ||
        (px > 0   && lmap[py*W+px-1]   !== m) ||
        (px < W-1 && lmap[py*W+px+1]   !== m);

      const [r,g,b] = onEdge ? edgeArr[m] : fillArr[m];
      buf[i]   = r;
      buf[i+1] = g;
      buf[i+2] = b;
      buf[i+3] = onEdge ? 255 : 235;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Glow: render edge pixels separately to a temp canvas, then blur-composite
  const tmp = document.createElement('canvas');
  tmp.width = W; tmp.height = H;
  const tc  = tmp.getContext('2d');
  const ei  = tc.createImageData(W, H);
  const eb  = ei.data;
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const m = lmap[py*W+px];
      const i = (py*W+px)*4;
      const onEdge =
        (py > 0   && lmap[(py-1)*W+px] !== m) ||
        (py < H-1 && lmap[(py+1)*W+px] !== m) ||
        (px > 0   && lmap[py*W+px-1]   !== m) ||
        (px < W-1 && lmap[py*W+px+1]   !== m);
      if (onEdge) {
        const [r,g,b] = edgeArr[m];
        eb[i]=r; eb[i+1]=g; eb[i+2]=b; eb[i+3]=255;
      }
    }
  }
  tc.putImageData(ei, 0, 0);
  ctx.save();
  ctx.filter = 'blur(8px)';  ctx.globalAlpha = 0.6; ctx.drawImage(tmp,0,0);
  ctx.filter = 'blur(3px)';  ctx.globalAlpha = 0.4; ctx.drawImage(tmp,0,0);
  ctx.restore();
}

// ── Tree layout engine ────────────────────────────────────────────────────────
const NW=68, NH=22, YGAP=46, XPAD=10;

function measure(node) {
  if (!node || node.leaf) return { ...node, subtreeW: NW + XPAD };
  const L = measure(node.left);
  const R = measure(node.right);
  return { ...node, left:L, right:R, subtreeW: L.subtreeW + R.subtreeW };
}
function place(node, cx, y) {
  if (!node) return null;
  if (node.leaf) return { ...node, cx, y };
  const L = place(node.left,  cx - node.right.subtreeW/2, y+YGAP);
  const R = place(node.right, cx + node.left.subtreeW/2,  y+YGAP);
  return { ...node, cx, y, left:L, right:R };
}
function treeH(n) { return !n||n.leaf ? 1 : 1+Math.max(treeH(n.left),treeH(n.right)); }

function TreeNodes({ node, accentColor }) {
  if (!node) return null;
  const isLeaf = node.leaf;
  const col    = isLeaf ? L_COLOR[node.label] : accentColor;
  return (
    <g>
      {node.parent_cx !== undefined && (
        <line
          x1={node.parent_cx} y1={node.parent_y + NH/2}
          x2={node.cx}        y2={node.y - NH/2}
          stroke="#ffffff14" strokeWidth={1.2} strokeDasharray="4 3"
        />
      )}
      <rect
        x={node.cx - NW/2} y={node.y - NH/2} width={NW} height={NH}
        rx={isLeaf ? 11 : 5}
        fill={isLeaf ? col+'20' : '#0c0c1e'}
        stroke={isLeaf ? col : '#2d2d50'}
        strokeWidth={1.3}
      />
      <text
        x={node.cx} y={node.y + 4.5} textAnchor="middle"
        fill={col} fontSize={7}
        fontFamily="'Space Mono',monospace"
        fontWeight={isLeaf ? '700' : '400'}
      >
        {isLeaf
          ? `${node.label} (${node.size})`
          : `${node.feat==='x'?'Glc':'BMI'} \u2264 ${node.thresh.toFixed(2)}`}
      </text>
      {!isLeaf && <>
        <TreeNodes node={{...node.left,  parent_cx:node.cx, parent_y:node.y}} accentColor={accentColor}/>
        <TreeNodes node={{...node.right, parent_cx:node.cx, parent_y:node.y}} accentColor={accentColor}/>
      </>}
    </g>
  );
}

function TreeViz({ tree, accentColor }) {
  const m    = measure(tree);
  const svgW = Math.max(260, m.subtreeW + 40);
  const svgH = treeH(tree) * YGAP + 20;
  const laid = place(m, svgW/2, 16);
  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH}
      style={{display:'block'}}>
      <TreeNodes node={laid} accentColor={accentColor}/>
    </svg>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function Tooltip({point, predicted, pxX, pxY, maxW}) {
  if (!point) return null;
  const correct = predicted === point.label;
  const col     = L_COLOR[point.label];
  const flipX   = pxX > maxW * 0.6;
  return (
    <div style={{
      position:'absolute',
      left:  flipX ? 'auto' : pxX+12,
      right: flipX ? maxW-pxX+8 : 'auto',
      top:   Math.max(4, pxY-74),
      background:'rgba(7,7,18,0.97)',
      border:`1px solid ${col}44`,
      borderRadius:10, padding:'7px 11px',
      fontSize:'0.6rem', fontFamily:"'Space Mono',monospace",
      pointerEvents:'none', zIndex:20, minWidth:118,
      boxShadow:`0 8px 30px #00000090, 0 0 0 1px ${col}14`,
      backdropFilter:'blur(8px)',
    }}>
      <div style={{color:col,fontWeight:700,marginBottom:3}}>{point.label} Risk</div>
      <div style={{color:'#4b5563',lineHeight:1.75}}>
        Glucose <span style={{color:'#9ca3af'}}>{point.x.toFixed(2)}</span><br/>
        BMI <span style={{color:'#9ca3af'}}>{point.y.toFixed(2)}</span>
      </div>
      <div style={{marginTop:5,color:correct?'#22d3ee':'#ff6b9d',fontWeight:700,fontSize:'0.58rem'}}>
        {correct ? '✓ correct' : `✗ got ${predicted}`}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Overfitting() {
  const [depth,    setDepth]    = useState(3);
  const [data,     setData]     = useState(INITIAL_DATA);
  const [addLabel, setAddLabel] = useState('High');
  const [adding,   setAdding]   = useState(false);
  const [animate,  setAnimate]  = useState(false);
  const [hovered,  setHovered]  = useState(null);
  const [hovPx,    setHovPx]    = useState({x:0,y:0});

  const canvasRef = useRef(null);
  const plotRef   = useRef(null);
  const W=400, H=400;

  const tree     = buildTree(data, 0, depth);
  const trainAcc = accuracy(tree, data);
  const testSet  = data.map(d=>({
    ...d,
    x: Math.min(1,Math.max(0,d.x+Math.sin(d.x*13)*0.06)),
    y: Math.min(1,Math.max(0,d.y+Math.cos(d.y*11)*0.06)),
  }));
  const testAcc = accuracy(tree, testSet);
  const gap     = trainAcc - testAcc;

  const status = depth<=2
    ? {label:'Underfitting', color:'#fbbf24', desc:'Too simple — misses real patterns'}
    : depth<=4
    ? {label:'Optimal',      color:'#22d3ee', desc:'Good balance of bias vs variance' }
    : {label:'Overfitting',  color:'#ff6b9d', desc:'Memorising noise, not patterns'   };

  useEffect(() => { renderBoundary(canvasRef.current, tree, W, H); }, [depth, data]);

  useEffect(() => {
    if (!animate) return;
    let d=1;
    const id = setInterval(()=>{ setDepth(d); d=d>=8?1:d+1; }, 750);
    return ()=>clearInterval(id);
  }, [animate]);

  const handlePlotClick = useCallback(e => {
    if (!adding) return;
    const rect = plotRef.current.getBoundingClientRect();
    const x = Math.min(0.99, Math.max(0.01, (e.clientX-rect.left)/rect.width));
    const y = Math.min(0.99, Math.max(0.01, 1-(e.clientY-rect.top)/rect.height));
    setData(prev=>[...prev,{x,y,label:addLabel}]);
  }, [adding, addLabel]);

  const handleMouseMove = useCallback(e => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx=(e.clientX-rect.left)/rect.width;
    const my=1-(e.clientY-rect.top)/rect.height;
    let closest=null, minD=Infinity;
    data.forEach(d=>{ const dist=Math.hypot(d.x-mx,d.y-my); if(dist<0.065&&dist<minD){minD=dist;closest=d;} });
    setHovered(closest);
    setHovPx({x:e.clientX-rect.left, y:e.clientY-rect.top});
  }, [data]);

  const removePoint = i => setData(prev=>prev.filter((_,j)=>j!==i));

  const simTree = buildTree(data,0,2);
  const deeTree = buildTree(data,0,7,1);

  return (
    <div style={{
      maxWidth:660, margin:'0 auto', padding:'1.1rem 0.8rem 3rem',
      fontFamily:"'Space Mono',monospace", color:'#e5e7eb',
      background:'#07070b85', minHeight:'100vh',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        *,*::before,*::after{box-sizing:border-box}

        .card{background:#0b0b1a;border:1px solid #ffffff0b;border-radius:16px;padding:.95rem 1rem;margin-bottom:.9rem}
        .ey{font-size:.52rem;letter-spacing:.13em;color:#2a2a45;text-transform:uppercase;margin-bottom:.6rem;display:block}

        .pill{font-family:'Space Mono',monospace;font-size:.57rem;padding:.25rem .68rem;border-radius:99px;
              border:1px solid #ffffff10;background:#ffffff07;color:#6b7280;cursor:pointer;
              transition:all .15s;white-space:nowrap;line-height:1.4}
        .pill:hover{background:#ffffff12;color:#c4c4d4}
        .pill.on{background:#ffffff13;color:#e5e7eb;border-color:#ffffff25}

        .plot-wrap{position:relative;width:100%;aspect-ratio:1;border-radius:12px;overflow:hidden;border:1px solid #ffffff0a}
        .plot-wrap canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
        .plot-wrap .pts{position:absolute;inset:0;width:100%;height:100%}

        input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:5px;
                          border-radius:3px;outline:none;cursor:pointer;border:none}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;
          border-radius:50%;border:2.5px solid #06060f;cursor:pointer}

        .bar-t{height:6px;background:#ffffff07;border-radius:3px;margin-top:4px;overflow:hidden}
        .bar-f{height:100%;border-radius:3px;transition:width .4s cubic-bezier(.4,0,.2,1)}

        .cmp-grid{display:grid;grid-template-columns:1fr;gap:.65rem}

        .tree-scroll{overflow-x:auto;overflow-y:auto;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:#ffffff14 transparent}
        .tree-scroll::-webkit-scrollbar{height:3px;width:3px}
        .tree-scroll::-webkit-scrollbar-thumb{background:#ffffff18;border-radius:2px}
      `}</style>

      {/* HEADER */}
      <div style={{marginBottom:'1.1rem'}}>
        <div style={{fontSize:'.5rem',letterSpacing:'.17em',color:'#2a2a45',marginBottom:5}}>MACHINE LEARNING · INTERACTIVE</div>
        <h1 style={{margin:0,fontSize:'clamp(.95rem,4vw,1.15rem)',fontWeight:700,color:'#f9fafb',lineHeight:1.2}}>
          Decision Tree · Overfitting
        </h1>
        <p style={{margin:'.28rem 0 0',fontSize:'.57rem',color:'#2a2a45'}}>
          Drag depth · tap plot to add points · tap a point to remove it
        </p>
      </div>

      {/* STATUS */}
      <div style={{
        display:'flex',alignItems:'center',gap:'.85rem',padding:'.85rem .95rem',
        borderRadius:16,border:`1px solid ${status.color}25`,background:`${status.color}0a`,
        marginBottom:'.9rem',transition:'all .35s',
      }}>
        <div style={{width:9,height:9,borderRadius:'50%',background:status.color,
                     boxShadow:`0 0 14px ${status.color}`,flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:'.88rem',fontWeight:700,color:status.color}}>{status.label}</div>
          <div style={{fontSize:'.56rem',color:'#4b5563',marginTop:2}}>{status.desc}</div>
        </div>
        <div style={{textAlign:'right',flexShrink:0}}>
          <div style={{fontSize:'.46rem',color:'#2a2a45',letterSpacing:'.1em'}}>DEPTH</div>
          <div style={{fontSize:'1.55rem',fontWeight:700,color:status.color,lineHeight:1}}>{depth}</div>
        </div>
      </div>

      {/* ACCURACY */}
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'.7rem'}}>
          <span className="ey" style={{marginBottom:0}}>Accuracy</span>
          <span style={{
            padding:'.12rem .5rem',borderRadius:99,fontSize:'.51rem',letterSpacing:'.07em',
            background:gap>20?'#ff6b9d15':'#ffffff08',
            color:gap>20?'#ff6b9d':'#2a2a45',
            border:`1px solid ${gap>20?'#ff6b9d28':'#ffffff0a'}`,
          }}>Gap {gap}% {gap>20?'⚠':'✓'}</span>
        </div>
        {[
          {label:'Train', value:trainAcc, color:'#a78bfa'},
          {label:'Test',  value:testAcc,  color:'#22d3ee'},
        ].map(({label,value,color})=>(
          <div key={label} style={{marginBottom:'.55rem'}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <span style={{fontSize:'.6rem',color:'#6b7280'}}>{label}</span>
              <span style={{fontSize:'.6rem',color,fontWeight:700}}>{value}%</span>
            </div>
            <div className="bar-t"><div className="bar-f" style={{width:`${value}%`,background:color}}/></div>
          </div>
        ))}
      </div>

      {/* SCATTER / BOUNDARY */}
      <div className="card">
        <div style={{display:'flex',flexWrap:'wrap',gap:'.4rem',alignItems:'center',marginBottom:'.7rem'}}>
          <span className="ey" style={{marginBottom:0,flex:'1 1 auto'}}>Decision Boundary</span>
          <button className={`pill ${adding?'on':''}`} onClick={()=>setAdding(a=>!a)}
            style={adding?{color:'#22d3ee',borderColor:'#22d3ee35',background:'#22d3ee0e'}:{}}>
            {adding?'✦ Adding':'+ Add'}
          </button>
          <button className={`pill ${animate?'on':''}`} onClick={()=>setAnimate(a=>!a)}
            style={animate?{color:'#ff6b9d',borderColor:'#ff6b9d35',background:'#ff6b9d0e'}:{}}>
            {animate?'⏹':'▶'}
          </button>
          <button className="pill" onClick={()=>{setData(INITIAL_DATA);setAdding(false);}}>Reset</button>
        </div>

        {adding && (
          <div style={{display:'flex',gap:'.38rem',marginBottom:'.6rem',alignItems:'center',flexWrap:'wrap'}}>
            <span style={{fontSize:'.51rem',color:'#2a2a45'}}>Class:</span>
            {LABELS.map(l=>(
              <button key={l} className="pill" onClick={()=>setAddLabel(l)} style={{
                color:L_COLOR[l],
                borderColor:addLabel===l?L_COLOR[l]+'60':L_COLOR[l]+'22',
                background:addLabel===l?L_COLOR[l]+'16':'transparent',
                fontWeight:addLabel===l?'700':'400',
              }}>{l}</button>
            ))}
            <span style={{fontSize:'.49rem',color:'#2a2a45'}}>· tap plot</span>
          </div>
        )}

        <div ref={plotRef} className="plot-wrap"
          onClick={handlePlotClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={()=>setHovered(null)}
          style={{cursor:adding?'crosshair':'default'}}
        >
          <canvas ref={canvasRef} width={W} height={H}/>
          <svg className="pts" onContextMenu={e=>e.preventDefault()}>
            <defs>
              {LABELS.map(l=>(
                <filter key={l} id={`g${l}`} x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              ))}
            </defs>
            {data.map((d,i)=>{
              const cx=`${d.x*100}%`, cy=`${(1-d.y)*100}%`;
              const pred=predict(tree,d), ok=pred===d.label, hov=hovered===d;
              const col=L_COLOR[d.label];
              return (
                <g key={i} style={{cursor:'pointer'}}
                  onClick={e=>{if(adding)return;e.stopPropagation();removePoint(i);}}>
                  {hov&&<circle cx={cx} cy={cy} r="15" fill={col+'22'}/>}
                  {!ok&&<circle cx={cx} cy={cy} r="10" fill="none" stroke="#fff"
                    strokeWidth={1.3} strokeDasharray="3 2.5" opacity={0.45}/>}
                  <circle cx={cx} cy={cy} r={hov?8:5.5}
                    fill={col} stroke={ok?'rgba(255,255,255,0.2)':'#fff'}
                    strokeWidth={ok?1:1.8} filter={hov?`url(#g${d.label})`:undefined}/>
                  {!ok&&<>
                    <line x1={`calc(${cx} - 3.5px)`} y1={`calc(${cy} - 3.5px)`}
                          x2={`calc(${cx} + 3.5px)`} y2={`calc(${cy} + 3.5px)`} stroke="#fff" strokeWidth={1.4}/>
                    <line x1={`calc(${cx} + 3.5px)`} y1={`calc(${cy} - 3.5px)`}
                          x2={`calc(${cx} - 3.5px)`} y2={`calc(${cy} + 3.5px)`} stroke="#fff" strokeWidth={1.4}/>
                  </>}
                </g>
              );
            })}
          </svg>
          {hovered&&<Tooltip point={hovered} predicted={predict(tree,hovered)}
            pxX={hovPx.x} pxY={hovPx.y} maxW={plotRef.current?.offsetWidth||300}/>}
        </div>

        <div style={{display:'flex',justifyContent:'center',marginTop:6}}>
          <span style={{fontSize:'.49rem',color:'#2a2a45'}}>→ Glucose (normalised)  ↑ BMI</span>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:'.7rem',justifyContent:'center',marginTop:'.5rem'}}>
          {LABELS.map(l=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:5,fontSize:'.56rem',color:'#6b7280'}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:L_COLOR[l],
                           boxShadow:`0 0 6px ${L_COLOR[l]}90`}}/>{l} Risk
            </div>
          ))}
          <div style={{display:'flex',alignItems:'center',gap:5,fontSize:'.56rem',color:'#6b7280'}}>
            <div style={{width:8,height:8,borderRadius:'50%',border:'1.5px dashed rgba(255,255,255,.4)'}}/> Misclassified
          </div>
        </div>
        <p style={{textAlign:'center',fontSize:'.49rem',color:'#1c1c30',margin:'.35rem 0 0'}}>Tap a point to remove it</p>
      </div>

      {/* DEPTH SLIDER */}
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'.5rem'}}>
          <span className="ey" style={{marginBottom:0}}>Tree Depth</span>
          <span style={{fontSize:'.7rem',fontWeight:700,color:status.color}}>
            {depth}{depth===1?' · stump':depth>=7?' · very deep':''}
          </span>
        </div>
        <input type="range" min={1} max={8} value={depth}
          onChange={e=>{setAnimate(false);setDepth(+e.target.value);}}
          style={{
            accentColor:status.color,
            background:`linear-gradient(to right,${status.color}60 ${((depth-1)/7)*100}%,#ffffff0d ${((depth-1)/7)*100}%)`,
          }}
        />
        <div style={{display:'flex',justifyContent:'space-between',marginTop:5}}>
          <span style={{fontSize:'.5rem',color:'#fbbf24'}}>← Underfit</span>
          <span style={{fontSize:'.5rem',color:'#22d3ee'}}>Optimal 3–4</span>
          <span style={{fontSize:'.5rem',color:'#ff6b9d'}}>Overfit →</span>
        </div>
      </div>

      {/* CURRENT TREE */}
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'.6rem'}}>
          <span className="ey" style={{marginBottom:0}}>Tree Structure · Depth {depth}</span>
          <span style={{fontSize:'.53rem',color:'#2a2a45'}}>{trainAcc}% train · {testAcc}% test</span>
        </div>
        <div className="tree-scroll" style={{
          background:'#0f0f1e', borderRadius:10,
          border:`1px solid ${status.color}18`, padding:'8px 16px 6px',
        }}>
          <TreeViz tree={tree} accentColor={status.color}/>
        </div>
        <p style={{textAlign:'center',fontSize:'.49rem',color:'#1c1c30',margin:'.35rem 0 0'}}>← scroll to see full tree →</p>
      </div>

      {/* COMPARISON */}
      <div className="card">
        <span className="ey">Structure Comparison</span>
        <div className="cmp-grid">
          {[
            {label:'Shallow · depth 2', t:simTree, color:'#fbbf24', tag:'Underfit'},
            {label:'Deep · depth 7',    t:deeTree, color:'#ff6b9d', tag:'Overfit' },
          ].map(({label,t,color,tag})=>(
            <div key={label} style={{
              borderRadius:10,border:`1px solid ${color}18`,background:`${color}07`,
              padding:'.6rem',display:'flex',flexDirection:'column',
              overflow:'hidden',minWidth:0,
            }}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6,flexShrink:0}}>
                <span style={{fontSize:'.55rem',color,lineHeight:1.3}}>{label}</span>
                <span style={{fontSize:'.52rem',color:'#2a2a45',flexShrink:0,marginLeft:4}}>{accuracy(t,data)}%</span>
              </div>
              <div style={{
                background:'#0f0f1e',borderRadius:8,
                border:`1px solid ${color}12`,padding:'6px 12px 4px',
                overflowX:'auto',overflowY:'auto',
                maxHeight:180,minHeight:0,
                WebkitOverflowScrolling:'touch',
                scrollbarWidth:'thin',scrollbarColor:'#ffffff14 transparent',
              }}>
                <TreeViz tree={t} accentColor={color}/>
              </div>
              <div style={{textAlign:'center',marginTop:6,fontSize:'.57rem',color,fontWeight:700,flexShrink:0}}>{tag}</div>
            </div>
          ))}
        </div>
        <p style={{textAlign:'center',fontSize:'.49rem',color:'#1c1c30',margin:'.35rem 0 0'}}>← scroll within each tree →</p>
      </div>

      {/* INSIGHT */}
      <div className="card" style={{borderColor:'#ffffff07'}}>
        <span className="ey">What's happening?</span>
        <p style={{margin:0,fontSize:'.6rem',color:'#4b5563',lineHeight:1.85}}>
          {depth<=2
            ? 'A shallow tree makes only coarse splits — it under-uses the data and misses real structure. High bias, low variance.'
            : depth<=4
            ? 'This depth captures the main patterns without memorising noise. Train and test accuracy are close — the sweet spot.'
            : 'A deep tree memorises every training point including noise. Train accuracy soars but test accuracy falls — classic overfitting.'}
        </p>
      </div>
    </div>
  );
}