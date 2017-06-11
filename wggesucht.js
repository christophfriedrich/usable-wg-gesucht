var BASEURL = 'https://www.wg-gesucht.de/api';

const CITY_MUENSTER = 91;

function search(cityid, filters, callback, page) {
  // set defaults for filters that are mandatory for the API
  if(filters == null || filters == undefined || typeof filters != 'object') filters = {};
  if(!filters.category) filters.category = 0;
  if(!filters.rent_type) filters.rent_type = 0;  
  
  // page is also a mandatory parameter
  if(page == null || page == undefined || isNaN(page)) page = 1;
  
  // compose query string from filters object
  filterstring = Object.keys(filters).map( (k) => k + "=" + encodeURIComponent(filters[k]) ).join('&');
  
  // do request
  $.get(BASEURL + '/asset/offers?city_id=' + cityid + '&' + filterstring + '&page=' + page, callback);
}