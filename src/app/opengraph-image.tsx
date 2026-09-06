import { ImageResponse } from 'next/og';

export const alt='BeforeYouBuy — Can I Afford It?';
export const size={width:1200,height:630};
export const contentType='image/png';

export default function Image(){
  return new ImageResponse(
    <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:'72px',background:'#0a0a0a',color:'#f5f5f5',fontFamily:'Arial, sans-serif'}}>
      <div style={{display:'flex',alignItems:'center',gap:'18px',fontSize:30,fontWeight:700}}>
        <div style={{width:58,height:58,borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f5f5',color:'#0a0a0a',fontSize:34}}>₹</div>
        <span>BeforeYouBuy</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'20px',maxWidth:'950px'}}>
        <div style={{fontSize:78,lineHeight:1.02,fontWeight:800,letterSpacing:'-3px'}}>Can I afford it?</div>
        <div style={{fontSize:34,lineHeight:1.25,color:'#bdbdbd'}}>Before you buy it, see what it does to your money.</div>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:24,color:'#9a9a9a'}}>
        <span>Cash · EMI · Runway · Reserve target</span>
        <span>No account. No database.</span>
      </div>
    </div>,
    size
  );
}
