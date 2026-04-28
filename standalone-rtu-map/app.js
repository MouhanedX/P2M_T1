

const rtus = [
  { id: "RTU_TN_01", name: "Tunis RTU", city: "Tunis", lat: 36.892388340093454, lng: 10.208442785262585, color: "#00d4aa" },
  { id: "RTU_TN_02", name: "Kef RTU", city: "Kef", lat: 36.16453974514943, lng: 8.703746814430998, color: "#0084ff" },
  { id: "RTU_TN_03", name: "Sidi Bouzid RTU", city: "Sidi Bouzid", lat: 35.037454686321325, lng: 9.486028916209502, color: "#00ff88" },
  { id: "RTU_TN_04", name: "Kairouan RTU", city: "Kairouan", lat: 35.680625546171335, lng: 10.09540541901131, color: "#b500d8" },
  { id: "RTU_TN_05", name: "Gafsa RTU", city: "Gafsa", lat: 34.428625020010145, lng: 8.7898838248927, color: "#e51837" }
];

const routes = [
  { id: "RTU_TN_02_R1", rtuId: "RTU_TN_02", to: "Route_1774203193124", lat: 36.163644910757554, lng: 8.715141950986906, distanceKm: 15, via: [[36.16464656701834, 8.70409599784782], [36.16508410133183, 8.704144269160565], [36.16548697730232, 8.70416572307733], [36.16577721999783, 8.7040906343686], [36.166006814204565, 8.703978001305522], [36.16618010328172, 8.704074575851443], [36.166305729738106, 8.704208662831283], [36.16637070886067, 8.704374930686326], [36.166379372739605, 8.704605560291698], [36.166379372739605, 8.704868370772237], [36.166409696308364, 8.705131181252737], [36.166431355993126, 8.705393991733274], [36.16642242505817, 8.70572144937008], [36.16639643343275, 8.706037894642545], [36.166374773738326, 8.706424065144562], [36.16636610985888, 8.706917505230432], [36.16634445015605, 8.707351947045195], [36.16687613159418, 8.70752423140977], [36.16665928435465, 8.708457677700393], [36.16617410739189, 8.71037780325203], [36.1657582390335, 8.711654311300336], [36.16549832018904, 8.71230865576207], [36.165039128124135, 8.71299518109897], [36.164458636192364, 8.713885518645258], [36.164311346510985, 8.714067876937884], [36.164086782728084, 8.714455425650005]] },
  { id: "RTU_TN_02_R2", rtuId: "RTU_TN_02", to: "Route_1774202549425", lat: 36.15685280521371, lng: 8.69294408869621, distanceKm: 32, via: [[36.166313244477195, 8.701000642811653], [36.166382555532714, 8.699767042596914], [36.16641721103748, 8.699005428551285], [36.1663392361302, 8.69862998500767], [36.16622660557161, 8.698404718881479], [36.16616595828071, 8.6980078214211], [36.16607931921233, 8.697675285711012], [36.16593203257629, 8.697428565668057], [36.16476239358223, 8.695776614076138], [36.16412991485572, 8.695004273072145], [36.16389598307502, 8.694596648653366], [36.16368804312834, 8.694178297276187], [36.16331548267769, 8.693041239686941], [36.16302089874226, 8.692311806516477], [36.162752306542174, 8.691721823805072], [36.16250970634467, 8.691003117593006], [36.1621468995329, 8.691195594478756], [36.16173100980856, 8.691410133646547], [36.161167822290075, 8.691581764980773], [36.16068261133746, 8.691678307606267], [36.16011941628736, 8.691689034564668], [36.15984214954577, 8.691678307606267], [36.15933093642025, 8.691785577190164], [36.158793725815094, 8.691925027649223], [36.1584904601383, 8.692128839858611], [36.15805722142235, 8.69225756335931], [36.157719293561996, 8.692429194693535], [36.15728605058481, 8.69267591473645]] },
  { id: "RTU_TN_02_R3", rtuId: "RTU_TN_02", to: "Route_1774203245714", lat: 36.17843001694744, lng: 8.707374123466137, distanceKm: 65, via: [[36.16756848520157, 8.701451851025364], [36.168313153049425, 8.702546261777227], [36.1704357221594, 8.705292363124865], [36.1741500948784, 8.706816108655218], [36.17626384311209, 8.707352456574654]] },
  { id: "RTU_TN_04_R1", rtuId: "RTU_TN_04", to: "Route_1774203307894", lat: 35.66849926373306, lng: 10.077536833961275, distanceKm: 19, via: [[35.68047048699065, 10.094322964294012], [35.68055765970562, 10.094140606001385], [35.679982318026866, 10.091984487365194], [35.675066548412794, 10.094333987924339], [35.674403987801455, 10.093175476418333], [35.67350603503642, 10.091738063994164], [35.67162048007228, 10.087942100014297]] },
  { id: "RTU_TN_04_R2", rtuId: "RTU_TN_04", to: "Route_1774203387450", lat: 35.700119999836275, lng: 10.105705866920088, distanceKm: 33, via: [[35.68153238753946, 10.095578414613994], [35.68181133617973, 10.095953858157609], [35.68204669833637, 10.096683291328073], [35.68226462564019, 10.096597475660982], [35.682613308088165, 10.097755987166988], [35.685690364629885, 10.09666183741131], [35.685847665111524, 10.096564889607965], [35.68623119849549, 10.097015421860311], [35.686409889556074, 10.097830670697869], [35.686693179441626, 10.098844368265635], [35.68690673576723, 10.099697161457579], [35.687446988760506, 10.100470924538905], [35.69057737380213, 10.10206078852121], [35.69340136352306, 10.103519654862103], [35.6965390126081, 10.104635258534584]] },
  { id: "RTU_TN_04_R3", rtuId: "RTU_TN_04", to: "Route_1774203492192", lat: 35.66639448975711, lng: 10.104065954778207, distanceKm: 32, via: [[35.679964467534646, 10.095610640553272], [35.67947629547509, 10.09575009101233], [35.679519882387545, 10.095857360596225], [35.67793330343493, 10.096350800682098], [35.67757593158037, 10.096093331148724], [35.67714005076627, 10.096297143358113], [35.676756473680456, 10.096640406026564], [35.67644263651166, 10.09682276431919], [35.6755060855667, 10.097488574743545], [35.674459940480496, 10.098089284413312], [35.67367532266671, 10.098883079334106], [35.67341106429776, 10.099075215680777], [35.67255669107723, 10.099718833184111], [35.67196385530471, 10.100164001957275], [35.671663076648194, 10.100378541125067], [35.67102228355697, 10.100641351605606], [35.668988592517756, 10.101394423104326], [35.66607189299544, 10.102499826364092], [35.66544413339849, 10.10269291161508], [35.66590623469233, 10.10380850777689]] },
  { id: "RTU_TN_03_R1", rtuId: "RTU_TN_03", to: "Route_1774203669254", lat: 35.02437019191522, lng: 9.477437518329543, distanceKm: 9, via: [[35.037045402264624, 9.48682361670731], [35.03466430126001, 9.487520868063802], [35.03221718392262, 9.48830935301901], [35.03161941965096, 9.487918434514723], [35.03063520230567, 9.487489356179182], [35.030292480983775, 9.487221182219422], [35.02936097474543, 9.48659901863289], [35.02870188372996, 9.486137759422146], [35.028130667217695, 9.486030489838251], [35.02788460348999, 9.48610557854698], [35.02774228921716, 9.485601585328103], [35.02763947793952, 9.485364856994646], [35.027437353002945, 9.485375583953047], [35.02719128718821, 9.485289768285915], [35.02683976331081, 9.485161044785258], [35.026602483839014, 9.485161044785258], [35.02642672082328, 9.485171771743659], [35.026101558247916, 9.485171771743659], [35.02494669535849, 9.484657981013259], [35.02614542566621, 9.480655605846287], [35.02625967206255, 9.480516155387226], [35.026154213856216, 9.480419612761695], [35.024721726412075, 9.47928255517245], [35.02527539017936, 9.477952412332217], [35.024642631282084, 9.477523333996634]] },
  { id: "RTU_TN_03_R2", rtuId: "RTU_TN_03", to: "Route_1774203549628", lat: 35.04390185543724, lng: 9.49767006720323, distanceKm: 5, via: [[35.03820747774686, 9.486458909111468], [35.038427149790564, 9.487274157949065], [35.0389868849429, 9.490599296441975], [35.03933790195878, 9.49270209411528], [35.039702552182916, 9.493785516912556], [35.04010181810678, 9.494607533726855], [35.04054982040736, 9.495304772878429], [35.041033084269685, 9.495776759047576], [35.04170086235737, 9.49627556261267]] },
  { id: "RTU_TN_03_R3", rtuId: "RTU_TN_03", to: "Route_1774203578126", lat: 35.02858554965614, lng: 9.456240964057507, distanceKm: 29, via: [[35.03773327090504, 9.48517157083293], [35.03694244206835, 9.482564919944352], [35.03587041742588, 9.479025023675963], [35.03416569354017, 9.473929718441145], [35.0320918577781, 9.467364819906994], [35.030879166721114, 9.463696200137944]] },
  { id: "RTU_TN_05_R1", rtuId: "RTU_TN_05", to: "Route_1774203747539", lat: 34.425365371777445, lng: 8.76662512632506, distanceKm: 18, via: [[34.428033518904066, 8.789599729626625], [34.42665259393766, 8.787239798781044], [34.42605949736599, 8.78644600386025], [34.426484402800014, 8.785920382899173], [34.42628080254902, 8.785813113315278], [34.42578507812536, 8.785856021148845], [34.42560803297592, 8.785866748107207], [34.42543098745156, 8.785244584520676], [34.42539557830169, 8.78492277576899], [34.42542213516549, 8.784311339140821], [34.425492953427735, 8.783850079930074], [34.427157135687956, 8.783292039629707], [34.4267145293759, 8.781221736660607], [34.425820457477506, 8.778025103060623], [34.425652264665636, 8.77419557891575]] },
  { id: "RTU_TN_05_R2", rtuId: "RTU_TN_05", to: "Route_1774203810867", lat: 34.4180210196122, lng: 8.78964561464761, distanceKm: 5, via: [[34.42839681104693, 8.790275640665365], [34.42779487481566, 8.790715445959348], [34.428051583444386, 8.79134833650428], [34.42441332894794, 8.792935926345871], [34.42435795647147, 8.792700159919567], [34.42241340249204, 8.794685085258662], [34.42032510001497, 8.792550653370347], [34.41903257739699, 8.789193115394541]] },
  { id: "RTU_TN_05_R3", rtuId: "RTU_TN_05", to: "Route_1774203864615", lat: 34.44586544096175, lng: 8.782165594460924, distanceKm: 13, via: [[34.428679426696284, 8.789052662259458], [34.42898924407815, 8.788881030925234], [34.43191917453533, 8.787336348917211], [34.43433562599195, 8.786113475660875], [34.4364245192008, 8.785555673824634], [34.436749657021394, 8.786531350109717], [34.439085973034466, 8.785469497644801], [34.44110394005169, 8.784589887056875], [34.44335196872242, 8.78331337900857]] },
  { id: "RTU_TN_01_R1", rtuId: "RTU_TN_01", to: "Route_1774204296494", lat: 36.86398504767072, lng: 10.298565801103491, distanceKm: 34, via: [[36.892336956256024, 10.211068046962335], [36.891761041125704, 10.211663893153162], [36.890387747794456, 10.212704408116911], [36.88982125709785, 10.21317639428602], [36.884345459173474, 10.220889809143095], [36.88243239560596, 10.2239796956677], [36.881616906034125, 10.22633962651332], [36.88080140775335, 10.228302659898524], [36.87920365484601, 10.231127305948265], [36.87853406731687, 10.231985462619388], [36.87755152567214, 10.231964566652511], [36.87624665478144, 10.232908538990767], [36.87494176159712, 10.234367405331659], [36.874312405938824, 10.235353423370956], [36.87379730614286, 10.235825409540064], [36.87309333080411, 10.23634030354274], [36.874191085932154, 10.239431177205871], [36.87467184337129, 10.24142639146624], [36.87498090012712, 10.245545543487637], [36.875447141015066, 10.245663231012243], [36.876348105664114, 10.246789942810183], [36.87777838871186, 10.248614722892182], [36.87987299703806, 10.25060993715255], [36.881160637576485, 10.251961533909544], [36.88108705524373, 10.256982469865228], [36.88026296700627, 10.260500912216855], [36.87916416885587, 10.263933538901393], [36.87765329558467, 10.266508008914764], [36.87614239242349, 10.268610492759029], [36.87542126901407, 10.269811912098602], [36.87504353498717, 10.271399501940191], [36.87446648018208, 10.273378547644386], [36.873779681067596, 10.275717024573206], [36.8729211734904, 10.278141317169116], [36.87182226971185, 10.281337950769098], [36.870465788559656, 10.283440434613363], [36.86776992540241, 10.287495224884427], [36.86708306607988, 10.288803913807897], [36.865461847459244, 10.290027142225776], [36.86474062322151, 10.293331045409612], [36.86470627904037, 10.29504735875186], [36.86446586934024, 10.297836367933023]] },
  { id: "RTU_TN_01_R2", rtuId: "RTU_TN_01", to: "Route_1774204456490", lat: 36.80020230805378, lng: 10.186388831584196, distanceKm: 14, via: [[36.8853124077232, 10.207845371186258], [36.884046166510274, 10.207329593598736], [36.881968840865774, 10.207061419639018], [36.881067504308184, 10.206889788304794], [36.87988287436701, 10.206331986468552], [36.87825183206107, 10.205463102839026], [36.87655207722407, 10.204401133958514], [36.87265782849393, 10.202224997025462], [36.871078143895275, 10.201581379522128], [36.869481255610474, 10.201109393353018], [36.86807321889367, 10.200658861100674], [36.865136863719876, 10.199693434845656], [36.86346149511814, 10.201198816306862], [36.860645173855815, 10.202700590481358], [36.856592236720196, 10.202872221815584], [36.84992846615097, 10.20214278864512], [36.82656633351603, 10.200598106637095], [36.823543742538064, 10.199525373244779], [36.8144027233219, 10.189613663693226], [36.80711100163529, 10.188405499761329], [36.80023668120636, 10.188748762429778]] },
  { id: "RTU_TN_01_R3", rtuId: "RTU_TN_01", to: "Route_1774204360105", lat: 36.890033855015716, lng: 10.171990310834623, distanceKm: 11, via: [[36.89010281269708, 10.198340012992945], [36.887547142889765, 10.195044984304687], [36.88704929943211, 10.194401366801314], [36.88664587218004, 10.193500302296622], [36.88643986595254, 10.192856684793288], [36.88619118046579, 10.189369559588416], [36.88630276760484, 10.188253955915934], [36.88641435458077, 10.187170533118657], [36.88631135122414, 10.18578595747652], [36.88595083838163, 10.183962374550376], [36.88915805229486, 10.182032456322268], [36.890445536256074, 10.181581924069924], [36.88955319428478, 10.178018861449294], [36.88970769270691, 10.17660290294193]] }
];



// Smooth curve algorithm
function chaikinSmooth(points, iterations = 2) {
  let refined = points;
  for (let i = 0; i < iterations; i += 1) {
    const next = [refined[0]];
    for (let j = 0; j < refined.length - 1; j += 1) {
      const p0 = refined[j];
      const p1 = refined[j + 1];
      const q = [0.75 * p0[0] + 0.25 * p1[0], 0.75 * p0[1] + 0.25 * p1[1]];
      const r = [0.25 * p0[0] + 0.75 * p1[0], 0.25 * p0[1] + 0.75 * p1[1]];
      next.push(q, r);
    }
    next.push(refined[refined.length - 1]);
    refined = next;
  }
  return refined;
}

function buildRouteAnchors(route, source) {
  return [[source.lat, source.lng], ...(route.via || []), [route.lat, route.lng]];
}

function buildRoutePath(route, source) {
  const anchors = buildRouteAnchors(route, source);
  return chaikinSmooth(anchors, 2);
}

function getRouteLabelPoint(path) {
  return interpolatePointAlongPath(path, 0.95);
}

function animatePropagation(pulseLines) {
  let offset1 = 0;
  let offset2 = 0;
  
  setInterval(() => {
    offset1 = (offset1 - 2.4) % 100;
    offset2 = (offset2 - 1.6) % 100;
    
    for (let i = 0; i < pulseLines.length; i += 2) {
      if (pulseLines[i]) pulseLines[i].setStyle({ dashOffset: `${offset1}px` });
      if (pulseLines[i + 1]) pulseLines[i + 1].setStyle({ dashOffset: `${offset2}px` });
    }
  }, 60);
}

// Global storage for polylines
const routePolylines = {};
const backbonePolylines = {};
const routePaths = {};
const routeAnchorPaths = {};
const routeEndpoints = {};
const rtuMarkers = {};
const rtuTooltips = {};
const alarmMarkers = []; // Storage for alarm indicator markers
let currentMap = null;
let currentRouteLayer = null;
let currentQuery = null;

const ALARM_MARKER_COLOR = "#f59e0b";
const ALARM_MARKER_BORDER_COLOR = "#ffffff";
const ALARM_MARKER_FILL_COLOR = "#f59e0b";

function normalizeRouteId(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeRouteToken(value) {
  return normalizeRouteId(value).replace(/[^A-Z0-9]/g, "");
}

function getFirstFiniteNumber(values) {
  const sourceValues = Array.isArray(values) ? values : [];

  for (const value of sourceValues) {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }

  return null;
}

function parseMapQueryParams() {
  const searchParams = new URLSearchParams(window.location.search);
  const routeId = searchParams.get("routeId") || searchParams.get("route") || searchParams.get("route_id") || "";
  const routeName = searchParams.get("routeName") || searchParams.get("route_name") || searchParams.get("to") || "";
  const rtuId = searchParams.get("rtuId") || searchParams.get("rtu_id") || searchParams.get("sourceRtuId") || "";
  const rawFaultDistance = getFirstFiniteNumber([
    searchParams.get("faultDistanceKm"),
    searchParams.get("fault_distance_km"),
    searchParams.get("faultLocationKm"),
    searchParams.get("fault_location_km"),
    searchParams.get("eventLocationKm"),
    searchParams.get("event_location_km"),
    searchParams.get("eventDistanceKm"),
    searchParams.get("event_distance_km"),
    searchParams.get("breakDistanceKm"),
    searchParams.get("break_distance_km"),
  ]);
  const mapMode = searchParams.get("mapMode") || searchParams.get("view") || "";

  const embedFromParam = searchParams.get("embed") === "1" || searchParams.get("mode") === "embed";
  let inIframe = false;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true;
  }

  return {
    routeId,
    routeIdKey: normalizeRouteId(routeId),
    routeIdToken: normalizeRouteToken(routeId),
    routeName,
    routeNameKey: normalizeRouteId(routeName),
    routeNameToken: normalizeRouteToken(routeName),
    rtuId,
    rtuIdKey: normalizeRouteId(rtuId),
    rtuIdToken: normalizeRouteToken(rtuId),
    focus: searchParams.get("focus") !== "0",
    embed: embedFromParam || inIframe,
    mapMode,
    faultDistanceKm: rawFaultDistance,
  };
}

function applyEmbedMode(query) {
  if (!query.embed) {
    return;
  }

  document.body.classList.add("embed-mode");

  const topbar = document.querySelector(".topbar");
  if (topbar) {
    topbar.style.display = "none";
  }
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function haversineDistanceKm(leftPoint, rightPoint) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const latitudeDelta = toRadians(rightPoint[0] - leftPoint[0]);
  const longitudeDelta = toRadians(rightPoint[1] - leftPoint[1]);

  const leftLatitude = toRadians(leftPoint[0]);
  const rightLatitude = toRadians(rightPoint[0]);

  const a = (Math.sin(latitudeDelta / 2) ** 2)
    + (Math.cos(leftLatitude) * Math.cos(rightLatitude) * (Math.sin(longitudeDelta / 2) ** 2));

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

function calculatePathLengthKm(path) {
  if (!Array.isArray(path) || path.length < 2) {
    return 0;
  }

  let totalLengthKm = 0;

  for (let index = 1; index < path.length; index += 1) {
    totalLengthKm += haversineDistanceKm(path[index - 1], path[index]);
  }

  return totalLengthKm;
}

function interpolatePointAlongPath(path, ratio) {
  if (!Array.isArray(path) || path.length === 0) {
    return null;
  }

  if (path.length === 1) {
    return path[0];
  }

  const clampedRatio = clamp(ratio, 0, 1);
  const segmentLengths = [];
  let totalLengthKm = 0;

  for (let index = 1; index < path.length; index += 1) {
    const segmentLengthKm = haversineDistanceKm(path[index - 1], path[index]);
    segmentLengths.push(segmentLengthKm);
    totalLengthKm += segmentLengthKm;
  }

  if (totalLengthKm <= 0) {
    return path[Math.floor((path.length - 1) * clampedRatio)];
  }

  const targetDistanceKm = totalLengthKm * clampedRatio;
  let traversedDistanceKm = 0;

  for (let index = 1; index < path.length; index += 1) {
    const segmentLengthKm = segmentLengths[index - 1];
    if ((traversedDistanceKm + segmentLengthKm) >= targetDistanceKm) {
      const localRatio = segmentLengthKm > 0
        ? (targetDistanceKm - traversedDistanceKm) / segmentLengthKm
        : 0;
      const leftPoint = path[index - 1];
      const rightPoint = path[index];

      return [
        leftPoint[0] + ((rightPoint[0] - leftPoint[0]) * localRatio),
        leftPoint[1] + ((rightPoint[1] - leftPoint[1]) * localRatio),
      ];
    }

    traversedDistanceKm += segmentLengthKm;
  }

  return path[path.length - 1];
}

function routeMatchesHint(route, hintKey, hintToken) {
  if (!hintKey && !hintToken) {
    return false;
  }

  const routeIdKey = normalizeRouteId(route?.id);
  const routeToKey = normalizeRouteId(route?.to);
  if (hintKey && (routeIdKey === hintKey || routeToKey === hintKey)) {
    return true;
  }

  if (!hintToken) {
    return false;
  }

  const routeIdToken = normalizeRouteToken(route?.id);
  const routeToToken = normalizeRouteToken(route?.to);

  return [routeIdToken, routeToToken].some((token) => token
    && (token === hintToken || token.includes(hintToken) || hintToken.includes(token)));
}

function resolveSelectedRoute(query) {
  const hasRouteHint = query.routeIdKey || query.routeNameKey || query.routeIdToken || query.routeNameToken;

  const rtuFilteredRoutes = routes.filter((route) => {
    if (!query.rtuIdKey) {
      return true;
    }
    return normalizeRouteId(route.rtuId) === query.rtuIdKey;
  });

  const constrainedRoutes = rtuFilteredRoutes.length > 0 ? rtuFilteredRoutes : routes;
  const routeHints = [
    { key: query.routeIdKey, token: query.routeIdToken },
    { key: query.routeNameKey, token: query.routeNameToken },
  ];

  if (hasRouteHint) {
    for (const hint of routeHints) {
      const selectedInConstrained = constrainedRoutes.find((route) => routeMatchesHint(route, hint.key, hint.token));
      if (selectedInConstrained) {
        return selectedInConstrained;
      }
    }

    for (const hint of routeHints) {
      const selectedInAll = routes.find((route) => routeMatchesHint(route, hint.key, hint.token));
      if (selectedInAll) {
        return selectedInAll;
      }
    }
  }

  if (constrainedRoutes.length === 1) {
    return constrainedRoutes[0];
  }

  return null;
}

function applyRouteFocusAndAlarmMarker(map, routeLayer, query) {
  const selectedRoute = resolveSelectedRoute(query);

  if (!selectedRoute) {
    return null;
  }

  const selectedRtuIdKey = normalizeRouteId(selectedRoute.rtuId);
  const alarmView = query.embed && query.focus && query.mapMode === "alarm";

  routes.forEach((route) => {
    const layers = routePolylines[route.id] || [];
    const isSelected = route.id === selectedRoute.id;

    layers.forEach((layer) => {
      if (!layer || typeof layer.setStyle !== "function") {
        return;
      }

      const baseOpacity = Number(layer.options?.opacity ?? 1);
      const baseWeight = Number(layer.options?.weight ?? 2);

      if (isSelected) {
        if (!routeLayer.hasLayer(layer)) {
          layer.addTo(routeLayer);
        }
        layer.setStyle({
          opacity: Math.max(baseOpacity, 0.9),
          weight: baseWeight + (baseWeight >= 5 ? 0.6 : 1.2),
        });
      } else if (alarmView) {
        if (routeLayer.hasLayer(layer)) {
          routeLayer.removeLayer(layer);
        }
      } else {
        if (!routeLayer.hasLayer(layer)) {
          layer.addTo(routeLayer);
        }
        if (query.embed && query.focus && routeLayer.hasLayer(layer)) {
          routeLayer.removeLayer(layer);
        } else {
          layer.setStyle({
            opacity: Math.min(baseOpacity, 0.12),
          });
        }
      }
    });

    const label = routePolylines[`${route.id}_label`];
    if (label) {
      if (isSelected) {
        label.addTo(routeLayer);
      } else if (alarmView || (query.embed && query.focus)) {
        routeLayer.removeLayer(label);
      } else if (typeof label.setOpacity === "function") {
        if (!routeLayer.hasLayer(label)) {
          label.addTo(routeLayer);
        }
        label.setOpacity(0.15);
      }
    }

    const endpointMarker = routeEndpoints[route.id];
    if (endpointMarker) {
      if (isSelected) {
        endpointMarker.addTo(routeLayer);
      } else if (alarmView || (query.embed && query.focus)) {
        if (routeLayer.hasLayer(endpointMarker)) {
          routeLayer.removeLayer(endpointMarker);
        }
      }
    }
  });

  Object.entries(rtuMarkers).forEach(([rtuId, marker]) => {
    const isSelectedRtu = normalizeRouteId(rtuId) === selectedRtuIdKey;
    if (query.embed && query.focus) {
      if (!isSelectedRtu && map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
      if (!isSelectedRtu && rtuTooltips[rtuId] && map.hasLayer(rtuTooltips[rtuId])) {
        map.removeLayer(rtuTooltips[rtuId]);
      }
    } else if (!isSelectedRtu && typeof marker.setOpacity === "function") {
      marker.setOpacity(0.2);
    }
  });

  const selectedPath = routePaths[selectedRoute.id] || [];
  const selectedAnchorPath = routeAnchorPaths[selectedRoute.id] || selectedPath;
  const selectedRenderablePath = selectedPath.length > 1 ? selectedPath : selectedAnchorPath;
  if (query.focus && selectedPath.length > 1) {
    map.fitBounds(L.latLngBounds(selectedPath), {
      padding: [20, 20],
      maxZoom: query.mapMode === "alarm" ? 15 : 14,
    });
  }

  // Clear previous alarm markers
  alarmMarkers.forEach((marker) => {
    if (routeLayer.hasLayer(marker)) {
      routeLayer.removeLayer(marker);
    }
  });
  alarmMarkers.length = 0;

  // Calculate alarm indicator position using the route's declared length so the
  // fault stays proportional even when the drawn geometry is stylized.
  const routeDistanceKm = Number(selectedRoute.distanceKm);
  const computedRouteLengthKm = calculatePathLengthKm(selectedAnchorPath);
  const routeLengthKm = Number.isFinite(routeDistanceKm) && routeDistanceKm > 0
    ? routeDistanceKm
    : computedRouteLengthKm;
  const faultDistanceKmValue = Number.isFinite(query.faultDistanceKm)
    ? Number(query.faultDistanceKm)
    : null;
  const hasPreciseFault = Number.isFinite(faultDistanceKmValue)
    && Number.isFinite(routeLengthKm)
    && routeLengthKm > 0;

  console.log("Alarm marker calculation:", {
    routeId: selectedRoute.id,
    faultDistanceKm: faultDistanceKmValue,
    routeDistanceKm,
    computedRouteLengthKm,
    routeLengthKm,
    hasPreciseFault,
    viaLength: (selectedRoute.via || []).length
  });

  let markerPoint = null;
  
  if (hasPreciseFault) {
    // Interpolate across the rendered route path so the marker stays on the visible line.
    const markerRatio = clamp(faultDistanceKmValue / routeLengthKm, 0, 1);
    markerPoint = interpolatePointAlongPath(selectedRenderablePath, markerRatio);
    console.log("Marker positioned from cumulative route distance:", {
      markerRatio,
      markerPoint,
    });
  } else if (selectedRenderablePath.length > 0) {
    // No fault distance, show middle of route
    markerPoint = selectedRenderablePath[Math.floor(selectedRenderablePath.length / 2)];
    console.log("No fault distance, using middle of route:", { markerPoint });
  }

  if (!markerPoint) {
    console.log("No marker point calculated");
    return selectedRoute.id;
  }

  const markerLatLng = L.latLng(markerPoint[0], markerPoint[1]);
  console.log("Creating alarm markers at:", { lat: markerPoint[0], lng: markerPoint[1] });

  // Outer ring
  const outerRing = L.circleMarker(markerLatLng, {
    radius: 20,
    color: ALARM_MARKER_COLOR,
    weight: 3,
    fillColor: ALARM_MARKER_FILL_COLOR,
    fillOpacity: 0.18,
    interactive: false,
    className: "alarm-focus-ring",
    pane: "markerPane"
  }).addTo(routeLayer);
  alarmMarkers.push(outerRing);
  if (typeof outerRing.bringToFront === "function") {
    outerRing.bringToFront();
  }
  console.log("Outer ring marker added");

  // Inner circle
  const innerCircle = L.circleMarker(markerLatLng, {
    radius: 9,
    color: ALARM_MARKER_BORDER_COLOR,
    weight: 2,
    fillColor: ALARM_MARKER_FILL_COLOR,
    fillOpacity: 1,
    interactive: false,
    className: "alarm-focus-core",
    pane: "markerPane"
  }).addTo(routeLayer);
  alarmMarkers.push(innerCircle);
  if (typeof innerCircle.bringToFront === "function") {
    innerCircle.bringToFront();
  }
  console.log("Inner circle marker added");

  // Animated pulse marker
  const pulseMarker = L.marker(markerLatLng, {
    interactive: false,
    zIndexOffset: 2500,
    icon: L.divIcon({
      className: "alarm-focus-pulse",
      html: '<span class="alarm-pulse-dot"></span>',
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    }),
    pane: "markerPane"
  })
    .bindTooltip(
      hasPreciseFault
        ? `Fault marker: ${faultDistanceKmValue.toFixed(2)} km`
        : "Alarm location (distance unavailable)",
      {
      permanent: true,
      direction: "top",
      offset: [0, -18],
      className: "alarm-focus-tooltip",
      }
    )
    .addTo(routeLayer);
  alarmMarkers.push(pulseMarker);
  console.log("Pulse marker added", { totalMarkers: alarmMarkers.length });

  if (query.focus) {
    const focusZoom = query.mapMode === "alarm" ? 14 : 13;
    map.flyTo(markerLatLng, Math.max(map.getZoom(), focusZoom), {
      animate: true,
      duration: 0.6,
    });
  }

  return selectedRoute.id;
}

const MAP_QUERY = parseMapQueryParams();
applyEmbedMode(MAP_QUERY);

function initMap() {
  const map = L.map("topology-map", {
    zoomControl: true,
    preferCanvas: true,
    attributionControl: false
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    minZoom: 6
  }).addTo(map);

  const tunisiaBounds = L.latLngBounds([30.05, 7.9], [37.65, 11.7]);
  map.setMaxBounds(tunisiaBounds);
  map.fitBounds(tunisiaBounds.pad(-0.02));

  const routeLayer = L.layerGroup().addTo(map);
  const rtuLayer = L.layerGroup().addTo(map);
  const pulseLines = [];
  const allLabels = [];

  // Render all routes
  routes.forEach((route) => {
    const source = rtus.find((rtu) => rtu.id === route.rtuId);
    if (!source) return;

    const anchorPath = buildRouteAnchors(route, source);
    const path = buildRoutePath(route, source);
    routeAnchorPaths[route.id] = anchorPath;
    routePaths[route.id] = path;
    const routePolysList = [];

    // Deep shadow layer for depth
    routePolysList.push(L.polyline(path, {
      color: source.color,
      weight: 11,
      opacity: 0.08,
      lineCap: "round",
      lineJoin: "round",
      className: "route-shadow-deep"
    }).addTo(routeLayer));

    // Outer glow layer
    routePolysList.push(L.polyline(path, {
      color: source.color,
      weight: 8,
      opacity: 0.22,
      lineCap: "round",
      lineJoin: "round",
      className: "route-glow-outer"
    }).addTo(routeLayer));

    // Inner glow layer
    routePolysList.push(L.polyline(path, {
      color: source.color,
      weight: 6,
      opacity: 0.38,
      lineCap: "round",
      lineJoin: "round",
      className: "route-glow-inner"
    }).addTo(routeLayer));

    // Main line - vibrant and solid
    routePolysList.push(L.polyline(path, {
      color: source.color,
      weight: 5.2,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
      className: "route-main"
    }).addTo(routeLayer));

    // Primary pulse - fast moving
    const pulseLine = L.polyline(path, {
      color: source.color,
      weight: 3,
      opacity: 0.92,
      dashArray: "10 12",
      dashOffset: "0px",
      lineCap: "round",
      className: "route-pulse-primary"
    }).addTo(routeLayer);

    routePolysList.push(pulseLine);
    pulseLines.push(pulseLine);

    // Accent pulse - white highlight
    const accentPulse = L.polyline(path, {
      color: "#ffffff",
      weight: 1.8,
      opacity: 0.75,
      dashArray: "18 14",
      dashOffset: "0px",
      lineCap: "round",
      className: "route-pulse-accent"
    }).addTo(routeLayer);

    routePolysList.push(accentPulse);
    pulseLines.push(accentPulse);

    routePolylines[route.id] = routePolysList;

    const labelPoint = getRouteLabelPoint(path);
    const label = L.marker(labelPoint, {
      interactive: false,
      icon: L.divIcon({
        className: "distance-label",
        html: `<span class="distance-chip" style="border-color: ${source.color}; color: ${source.color};">${route.distanceKm} km</span>`,
        iconSize: [86, 28],
        iconAnchor: [43, 14]
      })
    });
    
    routePolylines[route.id + "_label"] = label;
    allLabels.push(label);
    
    // Add label to layer initially
    label.addTo(routeLayer);

    // Endpoint marker (non-draggable)
    const endpointMarker = L.circleMarker([route.lat, route.lng], {
      radius: 6,
      color: source.color,
      fillColor: source.color,
      fillOpacity: 0.9,
      weight: 2,
      className: "route-endpoint"
    });

    endpointMarker
      .bindPopup(
        `<div class="popup-container">
          <div class="popup-header" style="border-left-color: ${source.color}">
            <h3 class="popup-id">${route.id}</h3>
            <span class="popup-type">Route Endpoint</span>
          </div>
          <div class="popup-divider"></div>
          <div class="popup-content">
            <div class="info-row">
              <span class="info-label">Source RTU</span>
              <span class="info-value">${route.rtuId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Destination</span>
              <span class="info-value">${route.to}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Distance</span>
              <span class="info-value">${route.distanceKm} km</span>
            </div>
          </div>
        </div>`
      )
      .addTo(routeLayer);

    routeEndpoints[route.id] = endpointMarker;
  });





  // RTU markers
  rtus.forEach((rtu) => {
    const marker = L.marker([rtu.lat, rtu.lng], {
      icon: L.divIcon({
        className: "draggable-rtu",
        html: `<div class="rtu-marker" style="background:${rtu.color}"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      })
    });

    marker
      .bindPopup(`<div class="popup-container">
        <div class="popup-header" style="border-left-color: ${rtu.color}">
          <h3 class="popup-id">${rtu.id}</h3>
          <span class="popup-type">Remote Terminal Unit</span>
        </div>
        <div class="popup-divider"></div>
        <div class="popup-content">
          <div class="info-row">
            <span class="info-label">Name</span>
            <span class="info-value" style="color: ${rtu.color}">${rtu.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Location</span>
            <span class="info-value">${rtu.city}, Tunisia</span>
          </div>
          <div class="info-row">
            <span class="info-label">Coordinates</span>
            <span class="info-value">${rtu.lat.toFixed(4)}, ${rtu.lng.toFixed(4)}</span>
          </div>
        </div>
      </div>`)
      .addTo(rtuLayer);

    rtuMarkers[rtu.id] = marker;

    const rtuTooltip = L.tooltip({
      permanent: true,
      direction: "right",
      offset: [14, 0],
      className: "rtu-tooltip"
    })
      .setLatLng([rtu.lat, rtu.lng])
      .setContent(`<strong>${rtu.id}</strong> ${rtu.city}`)
      .addTo(rtuLayer);

    rtuTooltips[rtu.id] = rtuTooltip;
  });

  const focusedRouteId = applyRouteFocusAndAlarmMarker(map, routeLayer, MAP_QUERY);
  
  // Store global references for updates
  currentMap = map;
  currentRouteLayer = routeLayer;
  currentQuery = MAP_QUERY;

  // Zoom-based label visibility
  function updateLabelVisibility() {
    if (MAP_QUERY.embed && MAP_QUERY.focus && focusedRouteId) {
      routes.forEach((route) => {
        const label = routePolylines[`${route.id}_label`];
        if (!label) {
          return;
        }

        if (route.id === focusedRouteId) {
          label.addTo(routeLayer);
        } else if (routeLayer.hasLayer(label)) {
          label.removeFrom(routeLayer);
        }
      });
      return;
    }

    const zoomLevel = map.getZoom();
    const showLabels = zoomLevel >= 10;
    
    allLabels.forEach((label) => {
      if (showLabels) {
        label.addTo(routeLayer);
      } else {
        label.removeFrom(routeLayer);
      }
    });
  }
  
  // Initial label visibility update
  updateLabelVisibility();
  
  // Update labels on zoom
  map.on('zoom', updateLabelVisibility);

  // Start pulse animation
  animatePropagation(pulseLines);
}

function updateKpisAndLists() {
  const avg = Math.round(routes.reduce((sum, route) => sum + route.distanceKm, 0) / routes.length);
  document.getElementById("kpi-rtus").textContent = `${rtus.length} RTUs`;
  document.getElementById("kpi-routes").textContent = `${routes.length} Routes`;
}

function updateMapAlarmFocus() {
  if (!currentMap || !currentRouteLayer || !currentQuery) {
    return;
  }

  const updatedQuery = parseMapQueryParams();
  
  // Check if query parameters have changed
  const hasChanged = (
    updatedQuery.faultDistanceKm !== currentQuery.faultDistanceKm ||
    updatedQuery.routeIdKey !== currentQuery.routeIdKey ||
    updatedQuery.routeNameKey !== currentQuery.routeNameKey ||
    updatedQuery.rtuIdKey !== currentQuery.rtuIdKey
  );

  if (hasChanged) {
    console.log("Query parameters changed, updating map focus and alarm marker:", updatedQuery);
    currentQuery = updatedQuery;
    applyRouteFocusAndAlarmMarker(currentMap, currentRouteLayer, updatedQuery);
  }
}

initMap();
updateKpisAndLists();

// Monitor URL changes and update map when parameters change
// This handles iframe URL parameter updates from the dashboard
let lastSearchParams = window.location.search;
const urlCheckInterval = setInterval(() => {
  if (window.location.search !== lastSearchParams) {
    lastSearchParams = window.location.search;
    updateMapAlarmFocus();
  }
}, 500); // Check every 500ms

// Also listen for popstate event (browser back/forward buttons)
window.addEventListener('popstate', () => {
  updateMapAlarmFocus();
});
