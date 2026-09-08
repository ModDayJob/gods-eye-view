export function initCreatorCredits(){
 const button=document.createElement('button');button.textContent='Credits';button.id='creator-credits-button';button.title='Original creators and community contributors';
 document.getElementById('top-center-actions')?.append(button);
 const dialog=document.createElement('dialog');dialog.className='gev-credits';
 const title=document.createElement('h2');title.textContent='Built on the work of the original creators';
 const intro=document.createElement('p');intro.textContent="God’s Eye View was created by Bilawal Sidhu and is maintained with Sameh Khamis at Halfpixel. Their open-source work makes this community edition possible.";
 const links=document.createElement('p');
 for(const [name,url] of [['Bilawal Sidhu','https://github.com/bilawalsidhu'],['Sameh Khamis','https://github.com/samehkhamis'],['Original project','https://github.com/bilawalsidhu/gods-eye-view'],['Halfpixel','https://halfpixel.ai']]){
  const a=document.createElement('a');a.textContent=name;a.href=url;a.target='_blank';a.rel='noopener noreferrer';links.append(a,document.createTextNode(' · '));
 }
 const edition=document.createElement('p');edition.textContent='Community extensions by ModDayJob, developed with AI assistance. MIT code attribution and individual data-source credits remain intact.';
 const inspiration=document.createElement('p');inspiration.textContent='Conflictly inspired the situation-dashboard workflow. This is an independent implementation; no affiliation or endorsement is implied.';
 const close=document.createElement('button');close.textContent='Close credits';close.onclick=()=>dialog.close();
 dialog.append(title,intro,links,edition,inspiration,close);document.body.append(dialog);button.onclick=()=>dialog.showModal();
}
