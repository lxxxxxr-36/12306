export function generateCaptcha(width=120, height=38){
  const text = Math.random().toString(36).slice(2,6); // 4位字母数字
  function draw(canvas: HTMLCanvasElement){
    const ctx = canvas.getContext('2d')!;
    // 背景
    ctx.fillStyle = '#f3f5f9';
    ctx.fillRect(0,0,width,height);
    // 文本
    ctx.font = 'bold 22px Microsoft YaHei, Arial';
    ctx.fillStyle = '#333';
    ctx.textBaseline = 'middle';
    ctx.save();
    for (let i=0;i<text.length;i++){
      const ch = text[i];
      const angle = (Math.random()*0.6-0.3);
      ctx.translate(24*i+20, height/2);
      ctx.rotate(angle);
      ctx.fillText(ch, -8, 0);
      ctx.rotate(-angle);
      ctx.translate(-24*i-20, -height/2);
    }
    ctx.restore();
    // 干扰线
    for(let i=0;i<4;i++){
      ctx.strokeStyle = `rgba(${Math.floor(Math.random()*255)},${Math.floor(Math.random()*255)},${Math.floor(Math.random()*255)},0.7)`;
      ctx.beginPath();
      ctx.moveTo(Math.random()*width, Math.random()*height);
      ctx.lineTo(Math.random()*width, Math.random()*height);
      ctx.stroke();
    }
  }
  return { text, draw };
}