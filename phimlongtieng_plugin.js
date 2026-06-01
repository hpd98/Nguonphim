// ============================================================
//  Plugin: PhimLongTieng (aphim7.com)
//  baseUrl: https://www.aphim7.com
//  playerType: auto (Hydrax embed → ExoPlayer hoặc WebView)
// ============================================================

var BASE_URL = "https://www.aphim7.com";

// ─────────────────────────────────────────
// A. NHÓM CONFIG
// ─────────────────────────────────────────

function getManifest() {
    return JSON.stringify({
        id: "phimlongtieng",
        name: "Phim Lồng Tiếng",
        version: "1.0.0",
        baseUrl: BASE_URL,
        iconUrl: BASE_URL + "/logo_aphim2.png",
        isEnabled: true,
        isAdult: false,
        type: "MOVIE",
        layoutType: "VERTICAL",
        playerType: "auto"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { id: "phim-moi", name: "Phim Mới Cập Nhật" },
        { id: "phim-bo",  name: "Phim Bộ" },
        { id: "phim-le",  name: "Phim Lẻ" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { id: "phim-hanh-dong", name: "Hành Động" },
        { id: "phim-vo-thuat",  name: "Võ Thuật" },
        { id: "phim-tam-ly",    name: "Tâm Lý" },
        { id: "phim-hai-huoc",  name: "Hài Hước" },
        { id: "phim-hoat-hinh", name: "Hoạt Hình" },
        { id: "phim-phieu-luu", name: "Phiêu Lưu" },
        { id: "phim-kinh-di",   name: "Kinh Dị" },
        { id: "phim-hinh-su",   name: "Hình Sự" },
        { id: "phim-chien-tranh", name: "Chiến Tranh" },
        { id: "phim-than-thoai", name: "Thần Thoại" },
        { id: "phim-vien-tuong", name: "Viễn Tưởng" },
        { id: "phim-co-trang",   name: "Cổ Trang" }
    ]);
}

function getFilterConfig() {
    return JSON.stringify([]);
}

// ─────────────────────────────────────────
// B. NHÓM URL
// ─────────────────────────────────────────

// Trang danh sách theo section (phim-bo, phim-le, the-loai/..., quoc-gia/...)
// slug = section id, filtersJson = { page: 1 }
function getUrlList(slug, filtersJson) {
    var filters = {};
    try { filters = JSON.parse(filtersJson); } catch(e) {}
    var page = filters.page || 1;

    var path;
    if (slug === "phim-moi") {
        path = "/phim-moi-cap-nhat/";
    } else if (slug === "phim-bo" || slug === "phim-le") {
        path = "/" + slug + "/";
    } else {
        // thể loại: slug dạng "phim-hanh-dong" → /the-loai/phim-hanh-dong/
        path = "/the-loai/" + slug + "/";
    }

    if (page > 1) {
        path = path + "page/" + page + "/";
    }
    return JSON.stringify({ url: BASE_URL + path });
}

function getUrlSearch(keyword, filtersJson) {
    var encoded = encodeURIComponent(keyword);
    return JSON.stringify({ url: BASE_URL + "/?s=" + encoded });
}

// URL trang chi tiết phim (slug = "co-may-thoi-gian")
function getUrlDetail(slug) {
    // Nếu slug là URL đầy đủ (episode id kiểu link tap) thì dùng trực tiếp
    if (slug.indexOf("http") === 0) {
        return JSON.stringify({ url: slug });
    }
    return JSON.stringify({ url: BASE_URL + "/phim/" + slug });
}

function getUrlCategories() {
    return JSON.stringify({ url: BASE_URL + "/" });
}

function getUrlCountries() {
    return JSON.stringify({ url: BASE_URL + "/" });
}

function getUrlYears() {
    return JSON.stringify({ url: BASE_URL + "/" });
}

// ─────────────────────────────────────────
// C. NHÓM PARSER
// ─────────────────────────────────────────

// Parse danh sách phim (trang chủ / thể loại / tìm kiếm)
function _parseMovieList(html) {
    var items = [];
    try {
        // Mỗi phim có pattern:
        // <a href="https://www.aphim7.com/phim/SLUG" title="TÊN">
        //   <img src="POSTER" ... />
        //   ...số tập...
        //   Tên phim
        // </a>
        var blockReg = /<a[^>]+href="(https?:\/\/www\.aphim7\.com\/phim\/([^"\/]+))"[^>]*title="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
        var match;
        while ((match = blockReg.exec(html)) !== null) {
            var url     = match[1];
            var slug    = match[2];
            var title   = match[3];
            var inner   = match[4];

            // Poster từ thẻ img
            var posterMatch = inner.match(/<img[^>]+src="([^"]+)"/);
            var poster = posterMatch ? posterMatch[1] : "";

            // Số tập (ví dụ "40/40" hoặc "Tập 10/12")
            var epMatch = inner.match(/(\d+\/\d+)/);
            var ep = epMatch ? epMatch[1] : "";

            // Tránh trùng
            var dup = false;
            for (var i = 0; i < items.length; i++) {
                if (items[i].id === slug) { dup = true; break; }
            }
            if (!dup && slug && title) {
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
        }
    } catch(e) {}
    return items;
}

function _parsePagination(html) {
    try {
        var curMatch = html.match(/class="page-numbers current"[^>]*>(\d+)<\/span>/);
        var current = curMatch ? parseInt(curMatch[1]) : 1;

        var allPages = [];
        var pageReg = /class="page-numbers"[^>]*>(\d+)<\//g;
        var pm;
        while ((pm = pageReg.exec(html)) !== null) {
            allPages.push(parseInt(pm[1]));
        }
        var total = allPages.length > 0 ? Math.max.apply(null, allPages) : current;
        return { currentPage: current, totalPages: total, totalItems: 0, itemsPerPage: 20 };
    } catch(e) {
        return { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 };
    }
}

function parseListResponse(html) {
    try {
        return JSON.stringify({
            items: _parseMovieList(html),
            pagination: _parsePagination(html)
        });
    } catch(e) {
        return JSON.stringify({ items: [], pagination: { currentPage:1, totalPages:1, totalItems:0, itemsPerPage:20 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

// Parse trang chi tiết phim → trả servers + episodes
function parseMovieDetail(html) {
    try {
        var titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
        var title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";

        var posterMatch = html.match(/meta-og:image:\s*(https?:\/\/[^\s]+)/);
        var poster = posterMatch ? posterMatch[1] : "";

        var descMatch = html.match(/meta-description:\s*([^\n]+)/);
        var desc = descMatch ? descMatch[1].trim() : "";

        var yearMatch = html.match(/(\d{4})\s*\)/);
        var year = yearMatch ? parseInt(yearMatch[1]) : 0;

        // Tìm tất cả link tập phim:
        // pattern: href="https://www.aphim7.com/phim/SLUG/tap-N"
        var episodes = [];
        var epReg = /href="(https?:\/\/www\.aphim7\.com\/phim\/[^"]+\/(tap-\d+))"[^>]*(?:title="[^"]*")?[^>]*>([^<]*)</g;
        var em;
        var seen = {};
        while ((em = epReg.exec(html)) !== null) {
            var epUrl  = em[1];
            var tapSlug = em[2];
            var label  = em[3].trim() || tapSlug.replace("tap-", "Tập ");
            if (!seen[epUrl]) {
                seen[epUrl] = true;
                // Dùng URL đầy đủ làm id để getUrlDetail() xử lý trực tiếp
                episodes.push({ id: epUrl, name: label, slug: tapSlug });
            }
        }

        // Nếu không tìm được tập nào → phim lẻ, dùng URL hiện tại
        if (episodes.length === 0) {
            var slugM = html.match(/canonical:\s*(https?:\/\/www\.aphim7\.com\/phim\/([^\/\s]+))/);
            if (slugM) {
                episodes.push({ id: slugM[1], name: "Full", slug: slugM[2] });
            }
        }

        var servers = [{ name: "APhim", episodes: episodes }];

        return JSON.stringify({
            id: "",
            title: title,
            posterUrl: poster,
            backdropUrl: "",
            description: desc,
            servers: servers,
            year: year,
            lang: "Lồng Tiếng"
        });
    } catch(e) {
        return JSON.stringify({ id:"", title:"", posterUrl:"", backdropUrl:"", description:"", servers:[] });
    }
}

// Parse trang xem tập → lấy link video
// Trang này dùng Hydrax player, iframe thường có dạng:
//   <iframe src="https://player.hydrax.com/..." ...>
// hoặc embed khác
function parseDetailResponse(html) {
    try {
        // Thử lấy link m3u8/mp4 trực tiếp
        var directM3u8 = html.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)['"]/);
        if (directM3u8) {
            return JSON.stringify({
                url: directM3u8[1],
                headers: { "Referer": BASE_URL + "/" },
                mimeType: "application/x-mpegURL",
                isEmbed: false
            });
        }

        var directMp4 = html.match(/["'](https?:\/\/[^"']+\.mp4[^"']*)['"]/);
        if (directMp4) {
            return JSON.stringify({
                url: directMp4[1],
                headers: { "Referer": BASE_URL + "/" },
                mimeType: "video/mp4",
                isEmbed: false
            });
        }

        // Hydrax embed
        var hydraxMatch = html.match(/src="(https?:\/\/player\.hydrax\.com\/[^"]+)"/);
        if (hydraxMatch) {
            return JSON.stringify({
                url: hydraxMatch[1],
                headers: { "Referer": BASE_URL + "/" },
                isEmbed: true,
                postBody: ""
            });
        }

        // Generic iframe embed
        var iframeMatch = html.match(/<iframe[^>]+src="(https?:\/\/[^"]+)"[^>]*>/);
        if (iframeMatch) {
            return JSON.stringify({
                url: iframeMatch[1],
                headers: { "Referer": BASE_URL + "/" },
                isEmbed: true,
                postBody: ""
            });
        }

        return JSON.stringify({ url: "", isEmbed: false });
    } catch(e) {
        return JSON.stringify({ url: "", isEmbed: false });
    }
}

// Xử lý bước embed trung gian (Hydrax hoặc embed khác)
function parseEmbedResponse(html, sourceUrl) {
    try {
        // Hydrax thường trả file dạng sources: [{ file: "..." }]
        var fileMatch = html.match(/["']?file["']?\s*:\s*["'](https?[^"']+)["']/);
        if (fileMatch) {
            var url = fileMatch[1];
            var mime = url.indexOf(".m3u8") !== -1 ? "application/x-mpegURL" : "video/mp4";
            return JSON.stringify({
                url: url,
                headers: { "Referer": sourceUrl },
                mimeType: mime,
                isEmbed: false
            });
        }

        // Tìm m3u8 / mp4 trực tiếp trong nội dung embed
        var m3u8 = html.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)['"]/);
        if (m3u8) {
            return JSON.stringify({
                url: m3u8[1],
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

        // Vẫn còn iframe lồng → tiếp tục
        var nextIframe = html.match(/<iframe[^>]+src="(https?:\/\/[^"]+)"/);
        if (nextIframe) {
            return JSON.stringify({
                url: nextIframe[1],
                headers: { "Referer": sourceUrl },
                isEmbed: true,
                postBody: ""
            });
        }

        return JSON.stringify({ url: "", isEmbed: false });
    } catch(e) {
        return JSON.stringify({ url: "", isEmbed: false });
    }
}
