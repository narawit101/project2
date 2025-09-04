"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import "@/app/css/map.css";

export default function LongdoMapPicker({ onLocationSelect, initialLocation }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const searchBoundRef = useRef(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const src = `https://api.longdo.com/map/?key=${process.env.NEXT_PUBLIC_LONGDO_KEY}`;

  // init map ONCE when SDK loads
  const initMap = () => {
    if (!window.longdo || !mapRef.current || mapInstance.current) return;

    const map = new window.longdo.Map({
      placeholder: mapRef.current,
      zoom: 12,
    });
    map.Ui.Crosshair.visible(false);
    mapInstance.current = map;

    // click -> use evt.location
    map.Event.bind("click", (evt) => {
      const p =
        evt?.location || map.location(window.longdo.LocationMode.Pointer);
      if (!p) return;
      const locStr = `${p.lat},${p.lon}`;
      console.log("map click ->", locStr);
      // send to parent
      try {
        onLocationSelect?.(locStr);
      } catch (e) {
        console.error(e);
      }

      // update marker
      try {
        if (markerRef.current) {
          map.Overlays.remove(markerRef.current);
          markerRef.current = null;
        }
      } catch (err) {
        console.warn("remove marker error", err);
      }
      try {
        const m = new window.longdo.Marker({ lat: p.lat, lon: p.lon });
        map.Overlays.add(m);
        markerRef.current = m;
      } catch (err) {
        console.error("add marker error", err);
      }
    });

    // bind search once
    if (!searchBoundRef.current) {
      map.Event.bind("search", (result) => {
        if (result?.data?.length) {
          setSearchResults(result.data);
          setShowDropdown(true);
        } else {
          setSearchResults([]);
          setShowDropdown(false);
        }
      });
      searchBoundRef.current = true;
    }
  };

  // --- เพิ่มฟังก์ชันที่ขาดไป ---
  const handleSearch = (keyword = searchKeyword) => {
    const map = mapInstance.current;
    if (!map || !map.Search) return;
    const term = String(keyword || "").trim();
    if (!term || term.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    try {
      map.Search.search(term, { limit: 10 });
    } catch (err) {
      console.error("search error", err);
    }
  };

  const handleInputChange = (e) => {
    const v = e.target.value;
    setSearchKeyword(v);
    if (v.length > 1) {
      handleSearch(v);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const selectPlace = (place) => {
    const map = mapInstance.current;
    if (!map || !place) return;
    const p = { lat: place.lat, lon: place.lon };
    const locStr = `${p.lat},${p.lon}`;
    try {
      map.location(p, true);
      // update marker
      try {
        if (markerRef.current) map.Overlays.remove(markerRef.current);
      } catch (e) {
        /* ignore */
      }
      const m = new window.longdo.Marker(p);
      map.Overlays.add(m);
      markerRef.current = m;
    } catch (err) {
      console.error("selectPlace error", err);
    }
    setSearchKeyword(place.name || "");
    setShowDropdown(false);
    try {
      onLocationSelect?.(locStr);
    } catch (err) {
      console.error("onLocationSelect error", err);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("เบราว์เซอร์ไม่รองรับการหาตำแหน่ง");
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude,
          lon = pos.coords.longitude;
        const map = mapInstance.current;
        const locStr = `${lat},${lon}`;
        if (map) {
          try {
            map.location({ lat, lon }, true);
            try {
              if (markerRef.current) map.Overlays.remove(markerRef.current);
            } catch (e) {}
            const m = new window.longdo.Marker({ lat, lon });
            map.Overlays.add(m);
            markerRef.current = m;
          } catch (err) {
            console.error("getCurrentLocation add marker error", err);
          }
        }
        try {
          onLocationSelect?.(locStr);
        } catch (err) {
          console.error("onLocationSelect error", err);
        }
        setIsGettingLocation(false);
      },
      (err) => {
        console.error("geolocation error", err);
        alert("ไม่สามารถหาตำแหน่งได้");
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };
  // --- จบเพิ่มฟังก์ชัน ---

  // แก้ JSX ให้เรียก initMap เมื่อ script โหลด
  return (
    <div className="map-wrapper">
      <Script
        src={src}
        strategy="afterInteractive"
        onReady={() => {
          if (window.longdo && !mapInstance.current) {
            initMap();
          }
        }}
      />

      <div className="map-search-bar">
        <div className="map-search-group">
          <input
            type="text"
            value={searchKeyword}
            placeholder="ค้นหาสถานที่..."
            className="map-search-input"
            onChange={handleInputChange}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            aria-label="ค้นหาสถานที่"
          />
          {showDropdown && searchResults.length > 0 && (
            <div className="search-dropdown" role="listbox">
              {searchResults.map((place, i) => (
                <div
                  key={i}
                  className="dropdown-item"
                  onClick={() => selectPlace(place)}
                  role="option"
                  tabIndex={0}
                >
                  <div className="place-name">{place.name}</div>
                  {place.address && (
                    <div className="place-address">{place.address}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="map-current-btn"
          aria-busy={isGettingLocation}
        >
          {isGettingLocation ? "กำลังหา..." : "ใช้ตำแหน่งของฉัน"}
        </button>
      </div>

      <div ref={mapRef} className="map-container" aria-label="Longdo map" />
    </div>
  );
}
