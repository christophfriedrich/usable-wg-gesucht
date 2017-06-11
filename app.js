// config
var config = {
  search: {cityid: CITY_MUENSTER, lat: 51.968687, lon: 7.610730, radius: 1500},
  landmarks: [
    {lat: 51.9624, lon: 7.6247, title: "Dom"},
    {lat: 51.9690, lon: 7.5958, title: "GEO1"}
  ]
};

// Leaflet stuff
var map;
var c1, c2, c3, c4;  // circles to show distances around flat
var offermarkers = {};  // holds the markers of the offers. object instead of array because doing offermarkers[id] is easier than offermarkers.find(lambda funtion here)

/**
 * sets the four circles that show the distances around flat to the specified lat/lon
 */
function showRadius(lat, lon) {
  [c1, c2, c3, c4].forEach((circle) => circle.setLatLng([lat, lon]));
}

// Database stuff
var offers = [];

function load() {
  offers = JSON.parse(localStorage.getItem('database')) || [];
}

function save() {
  localStorage.setItem('database', JSON.stringify(offers));
}

function databaseContains(offer) {
  return offers.find((o)=>o.offer_id==offer.offer_id) != undefined; 
}

function addOfferToDatabase(offer) {
  if(!databaseContains(offer)) {
    if(offer.tags == undefined) offer.tags = {read: false, interesting: undefined, contacted: false, invited: false};
    offers.push(offer);
    save();
  }
}

function toggleTag(type, offerid, visualizationElement) {
  offers.find((o)=>o.offer_id==offerid).tags[type] = (! offers.find((o)=>o.offer_id==offerid).tags[type]) || false;
  visualizationElement.classList.toggle("true");
  visualizationElement.classList.toggle("false");
  if(type=='interesting' && visualizationElement.classList.contains('undefined')) visualizationElement.classList.remove('undefined');
  save();
}

// GUI
function addOfferToGui(offer) {
  // create marker on map
  offermarkers[offer.offer_id] = L.marker([offer.geo_latitude, offer.geo_longitude], {title: offer.offer_title}).addTo(map).bindPopup(offer.street);
  
  // define template
  var template ="\
  <div class='offer' onmouseenter='$ONMOUSEENTER$' onmouseleave='$ONMOUSELEAVE$'>\
    <div class='tags'>\
      <span class='tags-read $TAGS_READ$' onclick='toggleTag(\"read\", \"$OFFER_ID$\", this)'></span>\
      <span class='tags-interesting $TAGS_INTERESTING$' onclick='toggleTag(\"interesting\", \"$OFFER_ID$\", this)'></span>\
      <span class='tags-contacted $TAGS_CONTACTED$' onclick='toggleTag(\"contacted\", \"$OFFER_ID$\", this)'></span>\
      <span class='tags-invited $TAGS_INVITED$' onclick='toggleTag(\"invited\", \"$OFFER_ID$\", this)'></span>\
    </div>\
    <h3><a href='http://www.wg-gesucht.de/$OFFER_ID$.html'>$OFFER_TITLE$</a></h3>\
    <span class='inhabitants'>$FLATSHARE_INHABITANTS_TOTAL$er-WG $FLATSHARE_INHABITANTS_VISUAL$\</span>\
    <span class='costs'>$TOTAL_COSTS$&nbsp;€ $TOTAL_COSTS_VISUAL$</span>\
    <span class='size'>$PROPERTY_SIZE$&nbsp;m² $PROPERTY_SIZE_VISUAL$</span>\
    <span class='fromdate'>$AVAILABLE_FROM_DATE_VISUAL$ ab $AVAILABLE_FROM_DATE_FORMATTED$</span>\
    <span class='street'>$STREET$</span>\
    <span class='distances'>$DISTANCES$</span>\
    <span class='onlinesince'>online seit $DATE_OF_ENTRY_DETAILS$</span>\
  </div>";
  
  // fill out placeholders that are directly part of the offer object
  Object.keys(offer).forEach((e) => template = template.replace(new RegExp('\\$'+e.toUpperCase()+'\\$', 'g'), offer[e]));
  
  // fill out custom placeholders with computed values
  var placeholders = [];
  placeholders.push({key: "ONMOUSEENTER", value: "offermarkers[\"" + offer.offer_id + "\"]._icon.src=\"marker-orange.svg\"; showRadius(" + offer.geo_latitude + "," + offer.geo_longitude + "); map.panTo([" + offer.geo_latitude + "," + offer.geo_longitude + "])"});
  placeholders.push({key: "ONMOUSELEAVE", value: "offermarkers[\"" + offer.offer_id + "\"]._icon.src=\"marker-blue.svg\""});
  placeholders.push({key: "FLATSHARE_INHABITANTS_VISUAL", value: (new Array(parseInt(offer.flatshare_males))).fill("👔").join('') + (new Array(parseInt(offer.flatshare_females))).fill("👚").join('') + (new Array(offer.flatshare_inhabitants_total-offer.flatshare_males-offer.flatshare_females)).fill("👨").join('')});
  placeholders.push({key: "TOTAL_COSTS_VISUAL", value: "💸".repeat(offer.total_costs/100)});
  placeholders.push({key: "PROPERTY_SIZE_VISUAL", value: "🔲".repeat((offer.property_size-8)/2)||"🛑"});
  placeholders.push({key: "AVAILABLE_FROM_DATE_FORMATTED", value: (new Date(offer.available_from_date*1000)).toLocaleDateString()});
  placeholders.push({key: "AVAILABLE_FROM_DATE_VISUAL", value: (((new Date(offer.available_from_date*1000) - new Date()) / (60*60*24*1000)) < 30 ? "🔜" : "")});
  placeholders.push({key: "DISTANCES", value: config.landmarks.map((e)=>e.title+': ' + Math.floor(offermarkers[offer.offer_id].getLatLng().distanceTo([e.lat, e.lon]))+'m').join(', ')});
  /*placeholders.push({key: "TAGS_READ", value: (offer.tags.read ? "👁" : "🆕")});
  placeholders.push({key: "TAGS_INTERESTING", value: (offer.tags.interesting == null ? "🤔" : offer.tags.interesting ? "👍" : "😐")});
  placeholders.push({key: "TAGS_CONTACTED", value: (offer.tags.contacted ? "✉️" : "📝")});
  placeholders.push({key: "TAGS_INVITED", value: (offer.tags.invited ? "👍" : "❓")});*/
  placeholders.push({key: "TAGS_READ", value: offer.tags.read});
  placeholders.push({key: "TAGS_INTERESTING", value: (offer.tags.interesting == null ? "undefined false" : offer.tags.interesting)});
  placeholders.push({key: "TAGS_CONTACTED", value: offer.tags.contacted});
  placeholders.push({key: "TAGS_INVITED", value: offer.tags.invited});
  placeholders.forEach((e) => template = template.replace(new RegExp('\\$'+e.key+'\\$', 'g'), e.value));
  
  // add filled out template to offers section
  document.getElementById('offers').innerHTML += template;
}

function mapInit() {
  // init map
  map = L.map('map', {
      center: [config.search.lat, config.search.lon],
      zoom: 14  // should usually work fairly well
  });

  // add standard OSM tiles as basemap
  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  
  // add circles with different radius (1km, 1.5km, 2km, 2.5km)
  c1 = L.circle([config.search.lat, config.search.lon], 1000, {fill: false, color: 'green'}).addTo(map);
  c2 = L.circle([config.search.lat, config.search.lon], 1500, {fill: false, color: 'yellow'}).addTo(map);
  c3 = L.circle([config.search.lat, config.search.lon], 2000, {fill: false, color: 'orange'}).addTo(map);
  c4 = L.circle([config.search.lat, config.search.lon], 2500, {fill: false, color: 'red'}).addTo(map);
  
  // add landmarks
  config.landmarks.forEach((e) => L.marker([e.lat, e.lon], {title: e.title, icon: L.icon({iconUrl: 'marker-red.svg'})}).bindPopup(e.title).addTo(map));
}

function showOffersFromDatabase() {  
  load();
  if(offers.length == 0) alert('The database is empty! Click "crawl" to fill it for the first time.');
  offers.forEach(addOfferToGui);
}

// Retrieving data
function crawl() {
  // set filtering criteria
  var filters = {
    // note that setting radAdd or lat/lng without the other will cause NO filtering!
    radAdd: "Beispielstraße 1, 12345 Musterstadt",
    radLat: config.search.lat,
    radLng: config.search.lon,
    radDis: config.search.radius  // distance in meters
  };
  search(config.search.cityid, filters, function(response) {
    var countbefore = offers.length;
    response._embedded.offers.forEach(addOfferToDatabase);
    alert('Done crawling! Added ' + (offers.length-countbefore) + ' new offers to the database.');
    showOffersFromDatabase();
  });
}

$(document).ready(function() {
  mapInit();
  showOffersFromDatabase();
});