const API="/api/backend";
const $=s=>document.querySelector(s);
const money=v=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format((Number(v)||0)/100);
const date=v=>v?new Date(v).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}):"—";
const esc=v=>String(v==null?"":v).replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c]||c});
let dashboard={summary:{},daily:[],recent:[]},orders=[];

async function api(path,options){
  options=options||{};
  options.credentials="include";
  options.headers=Object.assign({"Content-Type":"application/json"},options.headers||{});
  const r=await fetch(API+path,options);
  const d=await r.json().catch(function(){return{}});
  if(!r.ok)throw new Error(d.message||"Request failed");
  return d;
}
async function boot(){
  try{await api("/admin/me");showApp()}catch(e){}
}
function showApp(){
  $("#login").classList.add("hidden");
  $("#app").classList.remove("hidden");
  load();
}
$("#loginForm").addEventListener("submit",async function(e){
  e.preventDefault();
  $("#error").textContent="";
  try{
    await api("/admin/login",{method:"POST",body:JSON.stringify({token:$("#token").value})});
    $("#token").value="";
    showApp();
  }catch(e){$("#error").textContent=e.message}
});
$("#logout").onclick=async function(){await api("/admin/logout",{method:"POST"});location.reload()};
$("#refresh").onclick=load;

async function load(){
  try{
    dashboard=await api("/admin/dashboard");
    orders=(await api("/admin/orders?limit=100")).orders||[];
    render();
  }catch(e){alert(e.message)}
}
function render(){
  const s=dashboard.summary;
  const cards=[
    ["Revenue",money(s.gross_revenue),"paid sales"],
    ["Paid orders",s.paid_orders,(s.total_orders||0)+" total"],
    ["Customers",s.customers,"registered"],
    ["Downloads",s.downloads,"successful downloads"]
  ];
  $("#metrics").innerHTML=cards.map(function(c){
    return '<div class="metric"><span>'+c[0]+'</span><strong>'+c[1]+'</strong><em>'+c[2]+'</em></div>'
  }).join("");
  $("#total").textContent=money(s.gross_revenue);
  const max=Math.max.apply(null,dashboard.daily.map(function(x){return Number(x.revenue)}).concat([1]));
  $("#chart").innerHTML=dashboard.daily.map(function(x){
    const h=Math.max(3,Number(x.revenue)/max*190);
    return '<div class="bar" title="'+esc(x.label)+' · '+money(x.revenue)+'" style="height:'+h+'px"></div>'
  }).join("");
  $("#health").innerHTML=[
    ["Paid",s.paid_orders],["Pending",s.pending_orders],["Refunded",s.refunded_orders],["Total",s.total_orders]
  ].map(function(x){return '<div class="healthrow"><span>'+x[0]+'</span><strong>'+x[1]+'</strong></div>'}).join("");
  renderRecent();
  renderOrders();
  renderCustomers();
  renderDownloads();
}
function status(v){return '<span class="pill '+String(v).toLowerCase()+'">'+esc(v)+"</span>"}
function table(headers,rows){
  if(!rows.length)return '<p class="sub">No data yet.</p>';
  return '<div class="tablewrap"><table class="table"><thead><tr>'+headers.map(function(h){return "<th>"+h+"</th>"}).join("")+"</tr></thead><tbody>"+
    rows.map(function(row){return "<tr>"+row.map(function(v){return "<td>"+v+"</td>"}).join("")+"</tr>"}).join("")+
    "</tbody></table></div>";
}
function customerCell(o){return "<strong>"+esc(o.name||"Guest")+"</strong><div class='sub'>"+esc(o.email||"")+"</div>"}
function renderRecent(){
  $("#recent").innerHTML=table(["Order","Customer","Amount","Status","Downloads","Date"],dashboard.recent.map(function(o){
    return ["<strong>"+esc(o.order_number)+"</strong><div class='sub'>"+esc(o.razorpay_payment_id||"Awaiting payment")+"</div>",customerCell(o),money(o.amount),status(o.status),o.download_count,date(o.created_at)]
  }));
}
function renderOrders(){
  $("#orderTable").innerHTML=table(["Order","Customer","Product","Amount","Status","Downloads","Date"],orders.map(function(o){
    return ["<strong>"+esc(o.order_number)+"</strong><div class='sub'>"+esc(o.razorpay_order_id)+"</div>",customerCell(o),esc(o.product),money(o.amount),status(o.status),o.download_count,date(o.created_at)]
  }));
}
function renderCustomers(){
  const map={};
  orders.forEach(function(o){
    if(!o.email)return;
    if(!map[o.email])map[o.email]={name:o.name,email:o.email,orders:0,spent:0,downloads:0};
    map[o.email].orders++;
    if(o.status==="PAID")map[o.email].spent+=Number(o.amount||0);
    map[o.email].downloads+=Number(o.download_count||0);
  });
  $("#customerTable").innerHTML=table(["Customer","Orders","Spent","Downloads"],Object.keys(map).map(function(k){
    const c=map[k];return [customerCell(c),c.orders,money(c.spent),c.downloads]
  }));
}
function renderDownloads(){
  $("#downloadTable").innerHTML=table(["Order","Customer","Product","Downloads","Last activity","Expiry"],orders.filter(function(o){return o.status==="PAID"}).map(function(o){
    return [esc(o.order_number),customerCell(o),esc(o.product),(o.download_count||0)+" / "+(o.max_downloads||5),date(o.last_downloaded_at),date(o.expires_at)]
  }));
}
document.querySelectorAll("[data-page]").forEach(function(btn){
  btn.onclick=function(){
    document.querySelectorAll("main section").forEach(function(s){s.classList.add("hidden")});
    $("#"+btn.dataset.page).classList.remove("hidden");
    document.querySelectorAll("[data-page]").forEach(function(b){b.classList.remove("active")});
    btn.classList.add("active");
    $("#title").textContent=btn.dataset.page.charAt(0).toUpperCase()+btn.dataset.page.slice(1);
  };
});
$("#export").onclick=function(){
  const header=["Order","Name","Email","Product","Amount","Currency","Status","Payment ID","Downloads","Created"];
  const rows=orders.map(function(o){return [o.order_number,o.name,o.email,o.product,(Number(o.amount)/100).toFixed(2),o.currency,o.status,o.razorpay_payment_id||"",o.download_count,o.created_at]});
  const csv=[header].concat(rows).map(function(row){return row.map(function(v){return '"'+String(v==null?"":v).replace(/"/g,'""')+'"'}).join(",")}).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="resumecraft-orders.csv";a.click();
};
boot();