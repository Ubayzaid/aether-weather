const $ = (id) => document.getElementById(id);
const state = { lat: -6.1702, lon: 106.6403, city: "Tangerang", country: "Indonesia", unit: "celsius", data: null, searchTimer: null };
const weatherInfo = {
  0:["Cerah","☀️","clear-day"],1:["Cerah berawan","🌤️","clear-day"],2:["Berawan sebagian","⛅","cloudy"],3:["Berawan","☁️","cloudy"],
  45:["Berkabut","🌫️","cloudy"],48:["Kabut tebal","🌫️","cloudy"],
  51:["Gerimis ringan","🌦️","rainy"],53:["Gerimis","🌦️","rainy"],55:["Gerimis lebat","🌧️","rainy"],
  56:["Gerimis beku ringan","🌧️","rainy"],57:["Gerimis beku","🌧️","rainy"],
  61:["Hujan ringan","🌦️","rainy"],63:["Hujan","🌧️","rainy"],65:["Hujan lebat","🌧️","rainy"],
  66:["Hujan beku ringan","🌧️","rainy"],67:["Hujan beku lebat","🌧️","rainy"],
  71:["Salju ringan","🌨️","cloudy"],73:["Salju","🌨️","cloudy"],75:["Salju lebat","❄️","cloudy"],77:["Butiran salju","🌨️","cloudy"],
  80:["Hujan lokal","🌦️","rainy"],81:["Hujan sedang","🌧️","rainy"],82:["Hujan deras","⛈️","storm"],
  85:["Hujan salju","🌨️","cloudy"],86:["Hujan salju lebat","❄️","cloudy"],
  95:["Badai petir","⛈️","storm"],96:["Badai petir & hujan es","⛈️","storm"],99:["Badai petir kuat","⛈️","storm"]
};
const info = code => weatherInfo[code] || ["Kondisi tidak diketahui","🌡️","cloudy"];
const fmt = (date, opts) => new Intl.DateTimeFormat("id-ID", opts).format(date);
const timeText = value => value ? value.slice(11,16) : "--:--";
const temp = value => `${Math.round(state.unit === "celsius" ? value : value * 9/5 + 32)}°`;
const speed = value => `${Math.round(value)} km/j`;
const degDirection = deg => ["Utara","Timur Laut","Timur","Tenggara","Selatan","Barat Daya","Barat","Barat Laut"][Math.round(deg/45)%8];
const toast = message => { $("toast").textContent=message; $("toast").classList.add("show"); setTimeout(()=>$("toast").classList.remove("show"),2600); };

async function loadWeather(lat=state.lat, lon=state.lon, name=state.city, country=state.country) {
  $("cityName").textContent = name;
  $("conditionText").textContent = "Memperbarui kondisi cuaca...";
  try {
    const params = new URLSearchParams({
      latitude:lat, longitude:lon,
      current:"temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m",
      hourly:"temperature_2m,precipitation_probability,weather_code,uv_index,visibility",
      daily:"weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,daylight_duration,uv_index_max,precipitation_probability_max",
      timezone:"auto", forecast_days:"7", temperature_unit:state.unit
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) throw new Error("Gagal mengambil data cuaca.");
    const data = await response.json();
    state.lat=lat; state.lon=lon; state.city=name; state.country=country; state.data=data;
    render(data);
  } catch (error) {
    $("conditionText").textContent = "Tidak dapat memuat cuaca";
    toast("Koneksi gagal. Periksa internet lalu coba lagi.");
    console.error(error);
  }
}
function render(data) {
  document.querySelectorAll(".metric-card,.panel").forEach((el,i)=>{el.style.animation="none"; void el.offsetWidth; el.style.animation=`cardReveal .45s ${Math.min(i*35,280)}ms both`;});
  const c=data.current, h=data.hourly, d=data.daily, [label,icon,scene]=info(c.weather_code);
  const now=new Date(c.time);
  $("cityName").textContent=state.city;
  $("dateLine").textContent=`${fmt(now,{weekday:"long",day:"numeric",month:"long",year:"numeric"})} · ${state.country}`;
  $("updatedLabel").textContent=`DIPERBARUI ${timeText(c.time)}`;
  $("currentTemp").innerHTML=`${Math.round(c.temperature_2m)}<span>°</span>`;
  $("conditionText").textContent=label;
  $("feelsLike").textContent=`Terasa seperti ${temp(c.apparent_temperature)}`;
  $("heroIcon").textContent=icon;
  $("heroScene").className=`hero-card weather-scene ${scene}${c.is_day===0?" night":""}`;
  $("humidity").textContent=`${c.relative_humidity_2m}%`;
  $("humidityMeter").style.width=`${c.relative_humidity_2m}%`;
  $("wind").innerHTML=`${Math.round(c.wind_speed_10m)} <em>km/j</em>`;
  $("windDirection").textContent=`Arah ${degDirection(c.wind_direction_10m)} · ${Math.round(c.wind_direction_10m)}°`;
  const hourIndex=Math.max(0,h.time.findIndex(t=>t.slice(0,13)===c.time.slice(0,13)));
  const rain=h.precipitation_probability[hourIndex] ?? 0;
  $("rain").textContent=`${rain}%`; $("rainMeter").style.width=`${rain}%`;
  const uv=h.uv_index[hourIndex] ?? d.uv_index_max[0] ?? 0;
  $("uv").textContent=uv.toFixed(1);
  $("uvNote").textContent=uv<3?"Rendah":uv<6?"Sedang":uv<8?"Tinggi":uv<11?"Sangat tinggi":"Ekstrem";
  const uvLevel = uv<3?1:uv<6?2:uv<8?3:uv<11?4:5;
  $("uv").style.color = uv<3?"#73d5a5":uv<6?"#d8dc70":uv<8?"#f4b45f":uv<11?"#ed7b72":"#bd9bea";
  $("uvNote").title = `Indeks UV saat ini ${uv.toFixed(1)}`;
  $("sunrise").textContent=timeText(d.sunrise[0]); $("sunset").textContent=timeText(d.sunset[0]);
  $("sunriseBig").textContent=timeText(d.sunrise[0]); $("sunsetBig").textContent=timeText(d.sunset[0]);
  const daylight=d.daylight_duration[0]||0;
  $("daylight").textContent=`${Math.floor(daylight/3600)} jam ${Math.round(daylight%3600/60)} menit`;
  const sunrise=new Date(d.sunrise[0]).getTime(), sunset=new Date(d.sunset[0]).getTime();
  const progress=Math.max(0,Math.min(100,(now.getTime()-sunrise)/(sunset-sunrise)*100));
  $("sunProgress").style.width=`${progress}%`; $("sunDot").style.left=`${progress}%`;
  $("heroSummary").textContent=`${label}. Suhu tertinggi ${temp(d.temperature_2m_max[0])} dan terendah ${temp(d.temperature_2m_min[0])} hari ini.`;
  $("detailFeels").textContent=temp(c.apparent_temperature);
  $("cloud").textContent=`${c.cloud_cover}%`; $("pressure").textContent=`${Math.round(c.pressure_msl)} hPa`;
  $("visibility").textContent=`${((h.visibility[hourIndex]||0)/1000).toFixed(1)} km`;
  renderHourly(h,c.time); renderWeekly(d);
  $("hourlyDate").textContent=fmt(now,{day:"numeric",month:"short"}).toUpperCase()+" · 24 JAM";
}
function renderHourly(h,currentTime) {
  let start=h.time.findIndex(t=>t.slice(0,13)===currentTime.slice(0,13)); if(start<0)start=0;
  $("hourlyList").innerHTML=Array.from({length:24},(_,i)=>{
    const n=start+i;if(n>=h.time.length)return "";
    const [desc,icon]=info(h.weather_code[n]);
    const label=i===0?"Sekarang":timeText(h.time[n]);
    return `<div class="hour-item" title="${desc}"><div class="hour-time">${label}</div><div class="hour-icon">${icon}</div><div class="hour-temp">${temp(h.temperature_2m[n])}</div><div class="hour-rain">${h.precipitation_probability[n]||0}% hujan</div></div>`;
  }).join("");
}
function renderWeekly(d) {
  $("weeklyList").innerHTML=d.time.map((date,i)=>{
    const [desc,icon]=info(d.weather_code[i]);
    const day=i===0?"Hari ini":fmt(new Date(`${date}T12:00:00`),{weekday:"short"});
    return `<div class="day-item"><div class="day-name">${day}</div><div class="day-icon" title="${desc}">${icon}</div><div class="day-desc">${desc}</div><div class="day-temps">${temp(d.temperature_2m_max[i])}<span>${temp(d.temperature_2m_min[i])}</span></div></div>`;
  }).join("");
}
async function searchPlaces(query) {
  if(query.trim().length<2){$("suggestions").classList.add("hidden");return;}
  try{
    const url=`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=id&format=json`;
    const res=await fetch(url);const data=await res.json();
    const results=data.results||[];
    $("suggestions").innerHTML=results.length?results.map((p,i)=>`<div class="suggestion" data-index="${i}">${p.name}<small>${[p.admin1,p.country].filter(Boolean).join(", ")}</small></div>`).join(""):`<div class="suggestion">Lokasi tidak ditemukan</div>`;
    $("suggestions").classList.remove("hidden");
    $("suggestions").querySelectorAll("[data-index]").forEach(el=>el.addEventListener("click",()=>{
      const p=results[Number(el.dataset.index)];
      $("searchInput").value="";$("suggestions").classList.add("hidden");
      loadWeather(p.latitude,p.longitude,p.name,p.country||"");
    }));
  }catch(e){toast("Pencarian lokasi gagal.");}
}
$("searchInput").addEventListener("input",e=>{
  clearTimeout(state.searchTimer);$("clearSearch").style.display=e.target.value?"block":"none";
  state.searchTimer=setTimeout(()=>searchPlaces(e.target.value),350);
});
$("searchInput").addEventListener("keydown",e=>{if(e.key==="Escape")$("suggestions").classList.add("hidden");});
$("clearSearch").addEventListener("click",()=>{$("searchInput").value="";$("clearSearch").style.display="none";$("suggestions").classList.add("hidden");});
document.addEventListener("click",e=>{if(!e.target.closest(".search-wrap"))$("suggestions").classList.add("hidden");});
$("locationBtn").addEventListener("click",()=>{
  if(!navigator.geolocation){toast("Browser tidak mendukung lokasi.");return;}
  toast("Meminta izin lokasi...");
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{
      const r=await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&language=id&format=json`);
      const j=await r.json();const p=j.results?.[0];
      loadWeather(pos.coords.latitude,pos.coords.longitude,p?.name||"Lokasi saya",p?.country||"");
    }catch{loadWeather(pos.coords.latitude,pos.coords.longitude,"Lokasi saya","");}
  },()=>toast("Izin lokasi ditolak. Cari kota secara manual."));
});
$("unitBtn").addEventListener("click",()=>{state.unit=state.unit==="celsius"?"fahrenheit":"celsius";$("unitBtn").textContent=state.unit==="celsius"?"°C":"°F";if(state.data)loadWeather(state.lat,state.lon,state.city,state.country);});
$("themeBtn").addEventListener("click",()=>{document.body.classList.toggle("light");$("themeBtn").textContent=document.body.classList.contains("light")?"☀":"☾";});
loadWeather();
/* Small entrance motion for refreshed forecast panels */
const revealStyle = document.createElement("style");
revealStyle.textContent = "@keyframes cardReveal{from{opacity:.45;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}";
document.head.appendChild(revealStyle);
