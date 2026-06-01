function getManifest() {
    return JSON.stringify({
        id: "phimlongtieng",
        name: "Phim Lồng Tiếng",
        version: "1.0.0",
        baseUrl: "https://www.aphim7.com",
        iconUrl: "https://www.aphim7.com/logo_aphim2.png",
        isEnabled: true,
        isAdult: false,
        type: "MOVIE",
        layoutType: "VERTICAL",
        playerType: "auto"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { id: "phim-bo", name: "Phim Bộ" },
        { id: "phim-le", name: "Phim Lẻ" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { id: "phim-hanh-dong", name: "Hành Động" },
        { id: "phim-vo-thuat",  name: "Võ Thuật" },
        { id: "phim-tam-ly",    name: "Tâm Lý" },
        { id: "phim-hai-huoc",  name: "Hài Hước" },
        { id: "phim-hoat-hinh", name: "Hoạt Hình" },
        { id: "phim-kinh-di",   name: "Kinh Dị" },
        { id: "phim-co-trang",  name: "Cổ Trang" }
    ]);
}

function getFilterConfig() {
    return JSON.stringify([]);
}

function getUrlList(slug, filtersJson) {
    var filters = {};
    try { filters = JSON.parse(filtersJson); } catch(e) {}
    var page = filters.page || 1;
    var path;
    if (slug === "phim-bo" || slug === "phim-le") {
        path = "/" + slug + "/";
    } else {
        path = "/the-loai/" + slug + "/";
    }
    if (page > 1) {
        path = path + "page/" + page + "/";
    }
    return JSON.stringify({ url: "https://www.aphim7.com" + path });
}

function getUrlSearch(keyword, filtersJson) {
    return JSON.stringify({ url: "https://www.aphim7.com/?s=" + encodeURIComponent(keyword) });
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) {
        return JSON.stringify({ url: slug });
    }
    return JSON.stringify({ url: "https://www.aphim7.com/phim/" + slug });
}

function getUrlCategories() {
    return JSON.stringify({ url: "https://www.aphim7.com/" });
}

function getUrlCountries() {
    return JSON.stringify({ url: "https://www.aphim7.com/" });
}

function getUrlYears() {
    return JSON.stringify({ url: "https://www.aphim7.com/" });
}

function parseListResponse(html) {
    try {
        var items = [];
        var blockReg = /<a[^>]+href="(https?:\/\/www\.aphim7\.com\/phim\/([^"\/]+))"[^>]*title="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
        var match;
        var seen = {};
        while ((match = blockReg.exec(html)) !== null) {
            var slug  = match[2];
            var title = match[3];
            var inner = match[4];
            if (seen[slug] || !slug || !title) continue;
            seen[slug] = true;
            var posterMatch = inner.match(/<img[^>]+src="([^"]+)"/);
            var poster = posterMatch ? posterMatch[1] : "";
            var epMatch = inner.match(/(\d+\/\d+)/);
            var ep = epMatch ? epMatch[1] : "";
            items.push({
                id: slug,
                title: title,
                posterUrl: poster,
                backdropUrl: "",
                description: "",
                episode_current: ep,
                lang: "Lồng Tiếng"
            });
        }
        var curMatch = html.match(/class="page-numbers current"[^>]*>(\d+)</);
        var current = curMatch ? parseInt(curMatch[1]) : 1;
        return JSON.stringify({
            items: items,
            pagination: { currentPage: current, totalPages: current + 1, totalItems: 0, itemsPerPage: 20 }
        });
    } catch(e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    try {
        var titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
        var title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
        var posterMatch = html.match(/meta-og:image:\s*(https?:\/\/[^\s]+)/);
        var poster = posterMatch ? posterMatch[1] : "";
        var descMatch = html.match(/meta-description:\s*([^\n]+)/);
        var desc = descMatch ? descMatch[1].trim() : "";
        var episodes = [];
        var epReg = /href="(https?:\/\/www\.aphim7\.com\/phim\/[^"]+\/(tap-\d+))"/g;
        var em;
        var seen = {};
        while ((em = epReg.exec(html)) !== null) {
            var epUrl = em[1];
            var tapSlug = em[2];
            if (seen[epUrl]) continue;
            seen[epUrl] = true;
            var num = tapSlug.replace("tap-", "");
            episodes.push({ id: epUrl, name: "Tập " + num, slug: tapSlug });
        }
        if (episodes.length === 0) {
            var slugM = html.match(/canonical:\s*(https?:\/\/www\.aphim7\.com\/phim\/([^\/\s]+))/);
            if (slugM) {
                episodes.push({ id: slugM[1], name: "Full", slug: slugM[2] });
            }
        }
        return JSON.stringify({
            id: "",
            title: title,
            posterUrl: poster,
            backdropUrl: "",
            description: desc,
            servers: [{ name: "APhim", episodes: episodes }],
            lang: "Lồng Tiếng"
        });
    } catch(e) {
        return JSON.stringify({ id: "", title: "", posterUrl: "", backdropUrl: "", description: "", servers: [] });
    }
}

function parseDetailResponse(html) {
    try {
        var m3u8 = html.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)['"]/);
        if (m3u8) {
            return JSON.stringify({ url: m3u8[1], headers: { "Referer": "https://www.aphim7.com/" }, mimeType: "application/x-mpegURL", isEmbed: false });
        }
        var mp4 = html.match(/["'](https?:\/\/[^"']+\.mp4[^"']*)['"]/);
        if (mp4) {
            return JSON.stringify({ url: mp4[1], headers: { "Referer": "https://www.aphim7.com/" }, mimeType: "video/mp4", isEmbed: false });
        }
        var hydrax = html.match(/src="(https?:\/\/player\.hydrax\.com\/[^"]+)"/);
        if (hydrax) {
            return JSON.stringify({ url: hydrax[1], headers: { "Referer": "https://www.aphim7.com/" }, isEmbed: true, postBody: "" });
        }
        var iframe = html.match(/<iframe[^>]+src="(https?:\/\/[^"]+)"/);
        if (iframe) {
            return JSON.stringify({ url: iframe[1], headers: { "Referer": "https://www.aphim7.com/" }, isEmbed: true, postBody: "" });
        }
        return JSON.stringify({ url: "", isEmbed: false });
    } catch(e) {
        return JSON.stringify({ url: "", isEmbed: false });
    }
}

function parseEmbedResponse(html, sourceUrl) {
    try {
        var fileMatch = html.match(/["']?file["']?\s*:\s*["'](https?[^"']+)['"]/);
        if (fileMatch) {
            var url = fileMatch[1];
            var mime = url.indexOf(".m3u8") !== -1 ? "application/x-mpegURL" : "video/mp4";
            return JSON.stringify({ url: url, headers: { "Referer": sourceUrl }, mimeType: mime, isEmbed: false });
        }
        var m3u8 = html.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)['"]/);
        if (m3u8) {
            return JSON.stringify({ url: m3u8[1], headers: { "Referer": sourceUrl }, mimeType: "application/x-mpegURL", isEmbed: false });
        }
        var mp4 = html.match(/["'](https?:\/\/[^"']+\.mp4[^"']*)['"]/);
        if (mp4) {
            return JSON.stringify({ url: mp4[1], headers: { "Referer": sourceUrl }, mimeType: "video/mp4", isEmbed: false });
        }
        var nextIframe = html.match(/<iframe[^>]+src="(https?:\/\/[^"]+)"/);
        if (nextIframe) {
            return JSON.stringify({ url: nextIframe[1], headers: { "Referer": sourceUrl }, isEmbed: true, postBody: "" });
        }
        return JSON.stringify({ url: "", isEmbed: false });
    } catch(e) {
        return JSON.stringify({ url: "", isEmbed: false });
    }
}
