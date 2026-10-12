import React, { useEffect, useState } from "react";
import {
  fetchStates,
  fetchDistricts,
  fetchBlocks,
  fetchVillages,
  searchLocations,
  findNearestLocation,
} from "../api";

export default function LocationSelector({ onVillageSelected }) {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [villages, setVillages] = useState([]);
  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [blockId, setBlockId] = useState("");
  const [villageId, setVillageId] = useState("");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [locationStatus, setLocationStatus] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    fetchStates().then((res) => setStates(Array.isArray(res) ? res : []));
  }, []);

  useEffect(() => {
    if (stateId) fetchDistricts(stateId).then((res) => setDistricts(Array.isArray(res) ? res : []));
    else setDistricts([]);
  }, [stateId]);

  useEffect(() => {
    if (districtId) fetchBlocks(districtId).then((res) => setBlocks(Array.isArray(res) ? res : []));
    else setBlocks([]);
  }, [districtId]);

  useEffect(() => {
    if (blockId) fetchVillages(blockId).then((res) => setVillages(Array.isArray(res) ? res : []));
    else setVillages([]);
  }, [blockId]);

  const clearSelection = () => {
    setVillageId("");
    onVillageSelected(null);
  };

  const handleStateChange = (val) => {
    setStateId(val);
    setDistrictId("");
    setBlockId("");
    setVillageId("");
    setLocationStatus("");
    onVillageSelected(null);
  };

  const handleDistrictChange = (val) => {
    setDistrictId(val);
    setBlockId("");
    setVillageId("");
    setLocationStatus("");
    onVillageSelected(null);
  };

  const handleBlockChange = (val) => {
    setBlockId(val);
    setVillageId("");
    setLocationStatus("");
    onVillageSelected(null);
  };

  const selectLocation = (location) => {
    if (!location?.id) return;
    setStateId(location.state?.id ? String(location.state.id) : "");
    setDistrictId(location.district?.id ? String(location.district.id) : "");
    setBlockId(location.block?.id ? String(location.block.id) : "");
    setVillageId(String(location.id));
    setSearchResults([]);
    setLocationStatus(`Selected: ${[
      location.name,
      location.block?.name,
      location.district?.name,
      location.state?.name,
    ].filter(Boolean).join(", ")}`);
    onVillageSelected(location.id);
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    const term = query.trim();
    if (term.length < 2) {
      setLocationStatus("Enter at least 2 characters to search.");
      setSearchResults([]);
      return;
    }
    setLocationStatus("Searching localities…");
    const result = await searchLocations(term);
    if (!Array.isArray(result)) {
      setSearchResults([]);
      setLocationStatus("Search is unavailable. Please check the connection and try again.");
      return;
    }
    setSearchResults(result);
    setLocationStatus(result.length ? `Found ${result.length} matching location(s).` : "No matching localities found.");
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("This browser does not support device location. Search by locality instead.");
      return;
    }

    setIsLocating(true);
    setLocationStatus("Waiting for location permission…");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setLocationStatus("Finding the nearest mapped locality…");
        const result = await findNearestLocation(coords.latitude, coords.longitude);
        setIsLocating(false);
        if (!result?.id) {
          setLocationStatus("Your location was received, but no nearby localities have mapped coordinates yet. Please search by name or use the dropdowns.");
          return;
        }
        selectLocation(result);
        setLocationStatus(
          `Nearest mapped locality: ${result.name}${result.distance_km != null ? ` (about ${result.distance_km} km away)` : ""}. Please verify it is your locality.`
        );
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus("Location permission was denied. Allow location access in your browser settings or search by locality.");
        } else if (error.code === error.TIMEOUT) {
          setLocationStatus("Location request timed out. Try again or search by locality.");
        } else {
          setLocationStatus("Could not determine your location. Check device location settings or search by locality.");
        }
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
    );
  };

  return (
    <div className="space-y-4 rounded-[24px] bg-black/5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={isLocating}
          className="rounded-2xl bg-indigo-700 px-5 py-3 font-bold text-white shadow-md transition hover:bg-indigo-800 disabled:cursor-wait disabled:opacity-60"
        >
          {isLocating ? "Finding location…" : "📍 Use my location"}
        </button>
        <p className="self-center text-sm text-gray-600">
          Your browser will ask permission only after you tap this button.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by village, block, district or state"
          aria-label="Search locations"
          className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <button
          type="submit"
          className="rounded-2xl bg-gray-900 px-5 py-3 font-bold text-white transition hover:bg-black"
        >
          Search
        </button>
      </form>

      {searchResults.length > 0 && (
        <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2">
          {searchResults.map((location) => (
            <button
              type="button"
              key={location.id}
              onClick={() => selectLocation(location)}
              className="block w-full rounded-xl px-3 py-3 text-left transition hover:bg-indigo-50"
            >
              <span className="block font-bold text-gray-900">{location.name}</span>
              <span className="block text-sm text-gray-600">
                {[location.block?.name, location.district?.name, location.state?.name]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </button>
          ))}
        </div>
      )}

      {locationStatus && (
        <p role="status" aria-live="polite" className="rounded-xl bg-white/70 px-3 py-2 text-sm text-gray-700">
          {locationStatus}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        <select
          aria-label="State"
          className="w-full cursor-pointer rounded-2xl border border-white/40 bg-white/80 p-4 font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-300"
          value={stateId}
          onChange={(event) => handleStateChange(event.target.value)}
        >
          <option value="">🗺 Select state</option>
          {states.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>

        <select
          aria-label="District"
          className="w-full rounded-2xl border border-white/40 bg-white/80 p-4 font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-40"
          value={districtId}
          onChange={(event) => handleDistrictChange(event.target.value)}
          disabled={!stateId}
        >
          <option value="">🏢 Select district</option>
          {districts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>

        <select
          aria-label="Block"
          className="w-full rounded-2xl border border-white/40 bg-white/80 p-4 font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-40"
          value={blockId}
          onChange={(event) => handleBlockChange(event.target.value)}
          disabled={!districtId}
        >
          <option value="">🏘 Select block</option>
          {blocks.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>

        <select
          aria-label="Village"
          className="w-full rounded-2xl border border-white/40 bg-white/80 p-4 font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-40"
          value={villageId}
          disabled={!blockId}
          onChange={(event) => {
            const id = event.target.value;
            setVillageId(id);
            const chosen = villages.find((item) => String(item.id) === id);
            if (chosen) {
              setLocationStatus(`Selected: ${chosen.name}`);
              onVillageSelected(chosen.id);
            } else {
              clearSelection();
            }
          }}
        >
          <option value="">📍 Select village</option>
          {villages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>
    </div>
  );
}
