function getManifest() {
    return JSON.stringify({
        id: "nguonc",
        name: "Nguồn Phim",
        version: "1.0.0",
        baseUrl: "https://phim.nguonc.com",
        iconUrl: "https://phim.nguonc.com/public/images/Logo/logonc.png",
        isEnabled: true,
        isAdult: false,
        type: "MOVIE",
        layoutType: "VERTICAL",
        playerType: "exoplayer"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { id: "phim-moi", name: "Phim Mới Cập Nhật" },
        { id: "phim-bo", name: "Phim Bộ" },
        { id: "phim-le", name: "Phim Lẻ" },
        { id: "phim-dang-chieu", name: "Phim Đang Chiếu" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { id: "hanh-dong", name: "Hành Động" },
        { id: "phieu-luu", name: "Phiêu Lưu" },
        { id: "hoat-hinh", name: "Hoạt Hình" },
        { id: "phim-hai", name: "Hài" },
        { id: "hinh-su", name: "Hình Sự" },
        { id: "chinh-kich", name: "Chính Kịch" },
        { id: "kinh-di", name: "Kinh Dị" },
        { id: "lang-man", name: "Lãng Mạn" },
        { id: "tinh-cam", name: "Tình Cảm" },
        { id: "co-trang", name: "Cổ Trang" },
        { id: "khoa-hoc-vien-tuong", name: "Khoa Học Viễn Tưởng" },
        { id: "chien-tranh", name: "Chiến Tranh" }
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
    if (slug === "phim-moi") {
        path = "/danh-sach-phim?page=" + page;
    } else {
        path = "/danh-sach/" + slug + "?page=" + page;
    }
    return JSON.stringify({ url: "https://phim.nguonc.com" + path });
}

function getUrlSearch(keyword, filtersJson) {
    return JSON.stringify({ url: "https://phim.nguonc.com/tim-kiem?keyword=" + encodeURIComponent(keyword) });
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) {
        return JSON.stringify({ url: slug });
    }
    return JSON.stringify({ url: "https://phim.nguonc.com/api/film/" + slug });
}

function getUrlCategories() {
    return JSON.stringify({ url: "https://phim.nguonc.com/danh-sach-phim" });
}

function getUrlCountries() {
    return JSON.stringify({ url: "https://phim.nguonc.com/danh-sach-phim" });
}

function getUrlYears() {
    return JSON.stringify({ url: "https://phim.nguonc.com/danh-sach-phim" });
}

// Parse danh sách phim từ HTML
function parseListResponse(html) {
    try {
        var items = [];
        var seen = {};
        // Pattern link phim: href="/phim/slug" hoặc href="https://phim.nguonc.com/phim/slug"
        var reg = /href="(?:https?:\/\/phim\.nguonc\.com)?\/phim\/([^"]+)"[^>]*>\s*([^<]+)/g;
        var m;
        while ((m = reg.exec(html)) !== null) {
            var slug = m[1].trim();
            var title = m[2].trim();
            if (!slug || !title || seen[slug]) continue;
            seen[slug] = true;
            items.push({
                id: slug,
                title: title,
                posterUrl: "",
                backdropUrl: "",
                description: "",
                lang: "Vietsub"
            });
        }

        // Thử tìm poster từ thẻ img gần link phim
        var blockReg = /<a[^>]+href="(?:https?:\/\/phim\.nguonc\.com)?\/phim\/([^"]+)"[^>]*title="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
        var bm;
        var items2 = [];
        var seen2 = {};
        while ((bm = blockReg.exec(html)) !== null) {
            var slug2 = bm[1].trim();
            var title2 = bm[2].trim();
            var inner = bm[3];
            if (!slug2 || seen2[slug2]) continue;
            seen2[slug2] = true;
            var posterM = inner.match(/src="([^"]+)"/);
            var poster = posterM ? posterM[1] : "";
            var epM = inner.match(/(Tập \d+|Hoàn tất[^<]*|\d+\/\d+)/);
            var ep = epM ? epM[1] : "";
            items2.push({
                id: slug2,
                title: title2,
                posterUrl: poster,
                backdropUrl: "",
                description: "",
                episode_current: ep,
                lang: "Vietsub"
            });
        }

        var finalItems = items2.length > 0 ? items2 : items;

        // Pagination
        var pageM = html.match(/Trang\s*(\d+)\s*\/\s*(\d+)/);
        var curPage = pageM ? parseInt(pageM[1]) : 1;
        var totalPages = pageM ? parseInt(pageM[2]) : 1;
        var totalM = html.match(/Tổng\s*([\d]+)\s*Kết quả/);
        var totalItems = totalM ? parseInt(totalM[1]) : 0;

        return JSON.stringify({
            items: finalItems,
            pagination: { currentPage: curPage, totalPages: totalPages, totalItems: totalItems, itemsPerPage: 20 }
        });
    } catch(e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

// API trả về JSON trực tiếp — parse JSON
function parseMovieDetail(html) {
    try {
        var data = JSON.parse(html);
        var movie = data.movie;

        var episodes = [];
        var servers = [];

        if (movie.episodes && movie.episodes.length > 0) {
            for (var s = 0; s < movie.episodes.length; s++) {
                var server = movie.episodes[s];
                var epList = [];
                if (server.items) {
                    for (var i = 0; i < server.items.length; i++) {
                        var ep = server.items[i];
                        // Dùng m3u8 trực tiếp làm id nếu có
                        var epId = ep.m3u8 || ep.embed || ep.slug;
                        epList.push({
                            id: epId,
                            name: "Tập " + ep.name,
                            slug: ep.slug
                        });
                    }
                }
                servers.push({ name: server.server_name, episodes: epList });
            }
        }

        var poster = movie.poster_url || movie.thumb_url || "";

        return JSON.stringify({
            id: movie.slug,
            title: movie.name,
            posterUrl: poster,
            backdropUrl: movie.thumb_url || "",
            description: movie.description || "",
            servers: servers,
            year: 0,
            quality: movie.quality || "",
            lang: movie.language || "Vietsub",
            duration: movie.time || "",
            casts: movie.casts || "",
            director: movie.director || "",
            status: movie.current_episode || ""
        });
    } catch(e) {
        return JSON.stringify({ id: "", title: "", posterUrl: "", backdropUrl: "", description: "", servers: [] });
    }
}

// episode.id là link m3u8 trực tiếp → trả luôn không cần fetch thêm
function parseDetailResponse(html) {
    try {
        // Nếu html là link m3u8 trực tiếp
        if (html.indexOf(".m3u8") !== -1 && html.indexOf("{") === -1) {
            return JSON.stringify({
                url: html.trim(),
                headers: { "Referer": "https://phim.nguonc.com/" },
                mimeType: "application/x-mpegURL",
                isEmbed: false
            });
        }
        // Thử parse JSON (trường hợp app fetch api/film)
        var data = JSON.parse(html);
        if (data.movie && data.movie.episodes && data.movie.episodes.length > 0) {
            var firstEp = data.movie.episodes[0].items[0];
            if (firstEp && firstEp.m3u8) {
                return JSON.stringify({
                    url: firstEp.m3u8,
                    headers: { "Referer": "https://phim.nguonc.com/" },
                    mimeType: "application/x-mpegURL",
                    isEmbed: false
                });
            }
        }
        // Tìm m3u8 trong html
        var m3u8 = html.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)['"]/);
        if (m3u8) {
            return JSON.stringify({
                url: m3u8[1],
                headers: { "Referer": "https://phim.nguonc.com/" },
                mimeType: "application/x-mpegURL",
                isEmbed: false
            });
        }
        var embed = html.match(/["'](https?:\/\/[^"']+embed[^"']*)['"]/);
        if (embed) {
            return JSON.stringify({
                url: embed[1],
                headers: { "Referer": "https://phim.nguonc.com/" },
                isEmbed: true,
                postBody: ""
            });
        }
        return JSON.stringify({ url: "", isEmbed: false });
    } catch(e) {
        // html là URL m3u8 thuần
        if (html && html.indexOf("http") === 0) {
            return JSON.stringify({
                url: html.trim(),
                headers: { "Referer": "https://phim.nguonc.com/" },
                mimeType: "application/x-mpegURL",
                isEmbed: false
            });
        }
        return JSON.stringify({ url: "", isEmbed: false });
    }
}

function parseEmbedResponse(html, sourceUrl) {
    try {
        var m3u8 = html.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)['"]/);
        if (m3u8) {
            return JSON.stringify({
                url: m3u8[1],
                headers: { "Referer": sourceUrl },
                mimeType: "application/x-mpegURL",
                isEmbed: false
            });
        }
        var fileM = html.match(/["']?file["']?\s*:\s*["'](https?[^"']+)['"]/);
        if (fileM) {
            return JSON.stringify({
                url: fileM[1],
                headers: { "Referer": sourceUrl },
                mimeType: "application/x-mpegURL",
                isEmbed: false
            });
        }
        var mp4 = html.match(/["'](https?:\/\/[^"']+\.mp4[^"']*)['"]/);
        if (mp4) {
            return JSON.stringify({
                url: mp4[1],
                headers: { "Referer": sourceUrl },
                mimeType: "video/mp4",
                isEmbed: false
            });
        }
        return JSON.stringify({ url: "", isEmbed: false });
    } catch(e) {
        return JSON.stringify({ url: "", isEmbed: false });
    }
}
