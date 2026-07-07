export interface UserCoords {
    lat: number;
    lon: number;
    place: string;
}

/**
 * Gets exact coordinates using browser HTML5 Geolocation
 */
export const getBrowserLocation = (): Promise<UserCoords> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by your browser"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    place: "Current Location",
                });
            },
            (error) => {
                reject(error);
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    });
};

/**
 * Fallback: Gets approximate location based on IP address (no permission prompt)
 */
export const getIpBasedLocation = async (): Promise<UserCoords> => {
    try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error("IP Geolocation service error");
        const data = await res.json();
        return {
            lat: data.latitude || 28.6139,
            lon: data.longitude || 77.2090,
            place: data.city || "New Delhi",
        };
    } catch (error) {
        console.error("IP geocoding failed, using defaults", error);
        return {
            lat: 28.6139,
            lon: 77.2090,
            place: "New Delhi",
        };
    }
};
