import CookieJar from "./cookiejar";

export interface RobloxUser {
  id?: string;
  Id?: string;
  Username?: string;
  username?: string;
}

export async function getRobloxUser(username: string): Promise<RobloxUser> {
  const response = await fetch(`https://api.roblox.com/users/get-by-username?username=${username}`);
  const json = await response.json();
  return json;
}

export async function getRobloxUserById(id: string): Promise<RobloxUser> {
  const response = await fetch(`https://api.roblox.com/users/${id}`);
  const json = await response.json();
  return json;
}

export async function getRobloxUserHeadshot({ usernameOrId, res }: {usernameOrId: string, res: number}): Promise<string> {
  const user = await getRobloxUser(usernameOrId);
  let id = user.id;
  id ??= user.Id;
  const response = await fetch(`https://www.roblox.com/headshot-thumbnail/json?userId=${id}&width=${res}&height=${res}&format=png`);
  const responseCopy = response.clone();
  try {
    const json = await response.json();
    return json.Url;
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new SyntaxError("Error parsing JSON. Here is a part of the JSON: " + (await responseCopy.text()).substring(0, 100));
    }
    throw e;
  }
}



export async function getRobloxUserFromCookies(cookies: CookieJar): Promise<RobloxUser> {
  const response = await fetch("https://users.roblox.com/v1/users/authenticated", {
    headers: {
      "Cookie": cookies.toString(),
    }
  });

  return response.json();
}

export async function isAccountValid(cookie: CookieJar) {
  const { status } = await fetch("https://users.roblox.com/v1/users/authentificated", { headers: { "Cookie": cookie.toString() } });
  if (status === 200)
    return true;
  else
    return false;
}

const isValidRbxID = (id: string) => isNaN(Number(id)) !== true;

export async function getUniverseID(gameId: string) {
  // check if gameId is a valid rbx id
  if (!isValidRbxID(gameId)) {
    throw new Error("Invalid gameId");
  }

  const response = await fetch(`https://api.roblox.com/universes/get-universe-containing-place?placeid=${gameId}`);
  const json = await response.json();
  if (json.errors)
    throw new Error(json.errors[0].message);
  return json.UniverseId;

}

export interface iRobloxAsset {
  assetTypeId: number;
  assetType: string;
  imageId: number;
  videoHash?: any;
  videoTitle?: any;
  approved: boolean;
}

/**
 * Using the https://games.roblox.com/v2/games/{gameId}/media endpoint, get the assets for a game
 * @param gameId The Game ID of the game you want to get the assets for
 */
export async function getRobloxGameAssets(gameId: string): Promise<iRobloxAsset[]> {
  const response = await fetch(`https://games.roblox.com/v2/games/${gameId}/media`);
  const json = await response.json();
  return json.assets;
}


export type RobloxAssetSize = '50x50' | "128x128" | "150x150" | "256x256" | "512x512";

const thumbnailApiEndpoint = "https://thumbnails.roblox.com"
export async function getThumbnail(gameIds: number[], opts: { size: RobloxAssetSize, isCircular: boolean, returnPolicy?: "PlaceHolder" | "AutoGenerated" | "ForceAutoGenerated" } ): Promise<string[]> {
  const getIconUrl = thumbnailApiEndpoint + "/v1/games/icons";
  const { size, isCircular, returnPolicy } = opts;

  const formData = new FormData();
  formData.append("universeIds", gameIds.join(","));
  formData.append("returnPolicy", returnPolicy || "PlaceHolder");
  formData.append("size", size);
  formData.append("isCircular", isCircular.toString());
  formData.append("format", "png");
  const response = await fetch("https://thumbnails.roblox.com/v1/games/icons", {
    method: "GET",
    body: formData,
  });

  const json: { 
    errors?: {code: number, message: string}[],
    data?: { targetId: number, imageUrl: string }[]
  } = await response.json();
  if (json.errors) {
    throw new Error(json.errors[0].message);
  } else {
    if (!json.data)
      return [];

    return json.data.map(thumbnail => thumbnail.imageUrl);
  }
}
