import { useLocation } from "react-router-dom";
import { TippyLocationInfoLabel } from "../TippyLocationInfo";

const tenKm = {
  Schools: [
    "Rising Star School Junior College (4.5km, 11min)",
    "International Institute of Management Studies (4.5km, 11min)",
    "Sai Balaji International Institute of Management Sciences (4.6km, 11min)",
    "Smt. Karmavati English Medium School (6km, 16min)",
    "Alard University (6.5km, 17min)",
    "VIBGYOR High School (16km, 20min)",
    "Akshara International School Junior College (10.3km, 33min)",
    "Podar Prep plus Preschool (6.8km, 19min)",
    "Vedh Valley World CBSE School (11.4km, 37min)",
    "Crimson Anisha Global School (5km, 10min)",
    "Kidzee Marunji (5.3km, 14min)",
    "Sunflower Public School (5.7km, 16min)",
    "Kirloskar Institute of Management (6.3km, 11min)",
    "Symbiosis Junior College (12.4km, 32min)",

    "PCCOE  Pimpri Chinchwad College Of Engineering (13.14km,30min)",
    "Balaji College Of Arts Commerce Science (13.4km, 32min)",
    "JSPM College (12km, 22min)",
    "Indira Institute of Management MBA (11km, 22min)",

    "Elpro International School (15.9km, 32min)",

    "International Institute of Information Technology (11.4km, 35min)",
  ],
  Hospitals: [
    "Aditya Birla Memorial Hospital (13.8km, 30min)",
    "Lifepoint Multispeciality Hospital (10km, 20min)",
    "Ruby Hall Clinic (12km, 25min)",
    "Life Care Multispecility Hospital Punawale (8.5km, 21min)",
    "Vighnaharta Hospital (3.4km, 8min)",
    "Saidatta Multispeciality Hospital (4.6km,11min)",
  ],
  Hotels: [
    "Sneh Resort (3km, 10min)",
    "Sentosa Resort (11km, 30min)",
    "Sayaji Hotel (14.4km, 37min)",
    "Hotel TipTop International (15km, 38min)",
    "Courtyard Pune Hinjewadi (10.8km, 35min)",
    "Radisson Blue (11km,25min)",
    "Hyatt Place (10km,20min)",
    "Lemon Tree Hotel (10.7km,34min)",
    "ibis Pune Hinjewadi (10.8km,28min)",
  ],
  Malls: [
    "PVR Grand Highstreet Mall (9.3km, 25min)",
    "Xion Mall (10.1km, 31min)",
    "Phoenix Mall of the Millenium (11.5km, 30min)",
    "Vision One Mall (10km, 20min)",

    "Elpro City Square Mall (15km, 28min)",
    "18 Latitude Mall (8.7km, 22min)",
  ],
  Entertainment: [
    "Gravitation Park (4.2km, 9min)",
    "iGolf Pune  Fun Family Activities (1.5km, 4min)",
    "Crazy go karting and cafe restaurant (2.8km, 6min)",
    "The 24K Glamping Kasarsai Dam (4.8km ,12min)",
    "Buttefly Trampoline Park (9km, 15min)",

    "Ramkrishna More Natyagruha (15.9km, 35min)",
    "Ga di Madgulkar Natyagruha (14.4km, 32min)",
    "Japalouppe Equestrian Centre (11.4km, 25min)",
  ],
  "IT-Park": [
    "Eon West Wakad (10.4km, 34min)",
    "Embassy Tech Zone Phase-2 (7km, 15min)",
    "Wipro (9km, 20min)",
    "Infosys Phase 2 (10km, 20min)",
    "Quadron Business Park (12km, 25min)",
    "TCS (12km, 25min)",
    "Tech Mahindra (13.9km, 33min)",
    "Infosys Phase 1 (10.6km, 27min)",
    "Capgemini India (15km, 35min)",
    "Cognizant (15km, 34min)",
  ],
  Temples: [
    "Shri Chaurai Devi Mandir Somatne (11.4km, 24min)",
    "Birla Ganpati Temple (10.2km, 20min)",
    "Prati Shirdi Sai Baba (8km, 15min)",
    "ISKON Shree Govinda Dham Ravet (14km, 30min)",
    "Shri Balaji Temple Punawale (10km, 20min)",
    "Mhatoba Mandir Hinjawadi (10km, 20min)",
  ],
  Metro: [
    "Wakad chowk metro station (13km, 31min)",
    "Hinjewadi Phase-1 Metro Station (10.8km, 27min)",
    "Shivaji Chowk Metro Station (9.6km, 24min)",
    "Pall India Metro Station (8.9km, 23min)",
    "Wipro Circle Metro Station (10km, 20min)",
    "Infosys Phase II  Metro Station (10.9km, 28min)",
    "Dohler Metro Station (12.7km, 32min)",
    "Quadron Metro Station (13.3km, 33min)",
    "Megapolis circle metro station phase 3 (14.5km, 37min)",
  ],
  Landmarks: [
    "Kasarsai Dam (3.5km, 10min)",
    "Somatane Shirgaon Bridge (8.7km, 16min)",
    "MCA International Stadium (10km, 20min)",
    "Talegaon Toll Plaza (14.5km, 29min)",
    "Khamboli Dam (29.7km, 60min)",
  ],
};
const thirtyFiveKm = {
  Schools: [
    "Rising Star School Junior College (4.5km, 11min)",
    "International Institute of Management Studies (4.5km, 11min)",
    "Sai Balaji International Institute of Management Sciences (4.6km, 11min)",
    "Smt. Karmavati English Medium School (6km, 16min)",
    "Alard University (6.5km, 17min)",
    "VIBGYOR High School (16km, 20min)",
    "Akshara International School Junior College (10.3km, 33min)",
    "Podar Prep plus Preschool (6.8km, 19min)",
    "Vedh Valley World CBSE School (11.4km, 37min)",
    "Crimson Anisha Global School (5km, 10min)",
    "Kidzee Marunji (5.3km, 14min)",
    "Sunflower Public School (5.7km, 16min)",
    "Kirloskar Institute of Management (6.3km, 11min)",
    "Symbiosis Junior College (12.4km, 32min)",

    "PCCOE  Pimpri Chinchwad College Of Engineering (13.14km,30min)",
    "Balaji College Of Arts Commerce Science (13.4km, 32min)",
    "JSPM College (12km, 22min)",
    "Indira Institute of Management MBA (11km, 22min)",

    "Elpro International School (15.9km, 32min)",

    "International Institute of Information Technology (11.4km, 35min)",
    "NICMAR College (15km, 35min)",
  ],
  Hospitals: [
    "Aditya Birla Memorial Hospital (13.8km, 30min)",
    "Lifepoint Multispeciality Hospital (10km, 20min)",
    "Surya Mother And Child Super Speciality Hospital (12km, 25min)",
    "Apollo Clinic (15km, 28min)",
    "Ruby Hall Clinic (12km, 25min)",
    "Life Care Multispecility Hospital Punawale (8.5km, 21min)",
    "Vighnaharta Hospital (3.4km, 8min)",
    "Saidatta Multispeciality Hospital (4.6km,11min)",
  ],
  Hotels: [
    "Sneh Resort (3km, 10min)",
    "Sentosa Resort (11km, 30min)",
    "Sayaji Hotel (14.4km, 37min)",
    "Hotel TipTop International (15km, 38min)",
    "Courtyard Pune Hinjewadi (10.8km, 35min)",
    "Radisson Blue (11km,25min)",
    "Hyatt Place (10km,20min)",
    "Lemon Tree Hotel (10.7km,34min)",
    "ibis Pune Hinjewadi (10.8km,28min)",
  ],
  Malls: [
    "PVR Grand Highstreet Mall (9.3km, 25min)",
    "Xion Mall (10.1km, 31min)",
    "Phoenix Mall of the Millenium (11.5km, 30min)",
    "Vision One Mall (10km, 20min)",

    "Elpro City Square Mall (15km, 28min)",
    "18 Latitude Mall (8.7km, 22min)",
    "Balewadi High Street (15km, 28min)",
  ],
  Entertainment: [
    "Gravitation Park (4.2km, 9min)",
    "iGolf Pune  Fun Family Activities (1.5km, 4min)",
    "Crazy go karting and cafe restaurant (2.8km, 6min)",
    "The 24K Glamping Kasarsai Dam (4.8km ,12min)",
    "Buttefly Trampoline Park (9km, 15min)",

    "Ramkrishna More Natyagruha (15.9km, 53min)",
    "Ga di Madgulkar Natyagruha (14.4km, 32min)",
    "Japalouppe Equestrian Centre (11.4km, 25min)",
    "Dinosaur Garden (32.7km, 60min)",
  ],
  "IT-Park": [
    "Eon West Wakad (10.4km, 34min)",
    "Embassy Tech Zone Phase-2 (7km, 15min)",
    "Wipro (9km, 20min)",
    "Infosys Phase 2 (10km, 20min)",
    "Quadron Business Park (12km, 25min)",
    "TCS (12km, 25min)",
    "Tech Mahindra (13.9km, 33min)",
    "Infosys Phase 1 (10.6km, 27min)",
    "Capgemini India (15km, 35min)",
    "Cognizant (15km, 34min)",
    "Blueridge Business Park (12km, 20min)",
  ],
  Temples: [
    "Shri Chaurai Devi Mandir Somatne (11.4km, 24min)",
    "Birla Ganpati Temple (10.2km, 20min)",
    "Prati Shirdi Sai Baba (8km, 15min)",
    "ISKON Shree Govinda Dham Ravet (14km, 30min)",
    "Shri Balaji Temple Punawale (10km, 20min)",
    "Mhatoba Mandir Hinjawadi (10km, 20min)",
  ],
  Metro: [
    "Wakad chowk metro station  (13km, 31min)",
    "Hinjewadi Phase-1 Metro Station (10.8km, 27min)",
    "Shivaji Chowk Metro Station (9.6km, 24min)",
    "Pall India Metro Station (8.9km, 23min)",
    "Wipro Circle Metro Station (10km, 20min)",
    "Infosys Phase II  Metro Station (10.9km, 28min)",
    "Dohler Metro Station (12.7km, 32min)",
    "Quadron Metro Station (13.3km, 33min)",
    "Megapolis circle metro station phase 3 (14.5km, 37min)",
  ],
  Landmarks: [
    "Kasarsai Dam (3.5km, 10min)",
    "MCA International Stadium (10km, 20min)",
    "Somatane Shirgaon Bridge (8.7km, 16min)",

    "Talegaon Toll Plaza (14.5km, 29min)",
    "Khamboli Dam (29.7km, 60min)",
    "Kamshet (25km, 40min)",
    "Lonavala (40km, 40min)",
    "Pawana Lake (25km, 45min)",
    "Balewadi Stadium (16.5km, 46min)",
  ],
};

const LegendFilter = ({ label }) => {
  const location = useLocation();
  const istenKmRoute = location.pathname === "/tenkm";
  const isThirtyFiveKmRoute = location.pathname === "/thirtyfive";

  //   const data = isFiveKmRoute ? FiveSVG : isTwentyKmRoute ? TwentySVG : TenSVG; bg-[#105B30]/40
  const data = (isThirtyFiveKmRoute && thirtyFiveKm) || (istenKmRoute && tenKm);
  return (
    <div
      className="overlay-can-hide fixed top-24 left-[2%]"
      style={{ top: "40%", transform: "translateY(-50%)" }}
    >
      <div
        className="space-y-1 backdrop-blur-[6px] bg-[black]/50 rounded-lg p-2 shadow-lg scrollbar-hide"
      >
        <div className="text-white text-center sticky top-0  -mx-2 -mt-2 py-1 mb-1 z-10 rounded-t-lg">
          <span className="font-medium text-xs uppercase tracking-wider">
            {label?.toLowerCase() === "schools" ? "Education" : label}
          </span>
        </div>
        <ul className="text-white px-1">
          {data[label]?.map((item, index) => (
            <li
              key={index}
              className="flex gap-x-1 text-[10px] items-center py-0.5 hover:bg-white/10 rounded px-1 transition-colors duration-200"
            >
              <span className="text-[10px] font-medium min-w-[15px]">{index + 1}.</span>
              <span className="truncate max-w-[180px]" title={item.split("(")[0]}>{item.split("(")[0]}</span>
              <div className="ml-auto">
                <TippyLocationInfoLabel title={item} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LegendFilter;
