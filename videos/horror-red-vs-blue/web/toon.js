export const INK = "#241726";
export const SKIN = "#ffe2c2";
const WHITE = "#ffffff";
const MOUTH = "#5a1e28";
const TONGUE = "#e86e78";
const SH_SKIN = [
    0.96,
    0.86,
    0.84
];
const SH_CLOTH = [
    0.64,
    0.66,
    0.74
];
const SH_FELT = [
    0.62,
    0.62,
    0.7
];
const rad = (d)=>d * Math.PI / 180;
const clamp = (x, a, b)=>Math.max(a, Math.min(b, x));
export const mul = (c, m)=>{
    const n = parseInt(c.slice(1), 16);
    const ch = (v, k)=>Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0");
    return `#${ch(n >> 16 & 255, m[0])}${ch(n >> 8 & 255, m[1])}${ch(n & 255, m[2])}`;
};
export const shade = (c, k)=>mul(c, [
        k,
        k,
        k
    ]);
export const mix = (a, b, t)=>{
    const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
    const ch = (s)=>Math.round((A >> s & 255) * (1 - t) + (B >> s & 255) * t).toString(16).padStart(2, "0");
    return `#${ch(16)}${ch(8)}${ch(0)}`;
};
const rnd = (seed, k)=>{
    const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453;
    return x - Math.floor(x);
};
const rotPts = (pts, a, cx, cy)=>pts.map(([x, y])=>[
            cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a),
            cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)
        ]);
const rotAbout = (q, a, c)=>rotPts([
        q
    ], a, c[0], c[1])[0];
const lerp2 = (a, b, t)=>[
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t
    ];
const curve = (a, k, b, n = 10)=>{
    const c = [
        2 * k[0] - (a[0] + b[0]) / 2,
        2 * k[1] - (a[1] + b[1]) / 2
    ], out = [];
    for(let i = 0; i <= n; i++){
        const t = i / n, s = 1 - t;
        out.push([
            s * s * a[0] + 2 * s * t * c[0] + t * t * b[0],
            s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]
        ]);
    }
    return out;
};
export const RIFLEMAN = {
    jacket: "#357650",
    pants: "#3d4440",
    boots: INK,
    hat: "shako",
    belt: "#f1efe6",
    buttons: "#d9dde0",
    rifle: true
};
export const OFFICER = {
    ...RIFLEMAN,
    hat: "shako_tall",
    buttons: "#e8c45a",
    sash: "#c0353a",
    sword: true,
    moustache: "#4a3020",
    rifle: false,
    belt: null,
    build: "stout"
};
export const KID = {
    jacket: "#f08a2c",
    pants: "#3b5b9a",
    boots: "#f4f1ea",
    hat: "cap",
    cap: "#e2453c",
    build: "kid"
};
export const PARENT = {
    jacket: "#7b5ac9",
    pants: "#3b3f52",
    boots: "#5a3b2a",
    hat: "hair",
    hair: "#5a3b2a"
};
export const SKINS = [
    SKIN,
    "#f5c9a0",
    "#ecd0b6",
    "#c99067"
];
export const soldier = (v = 0, extra = {})=>{
    const o = {
        ...RIFLEMAN,
        skin: SKINS[v % 4]
    };
    if (v % 4 === 1) o.moustache = "#4a3426";
    if (v % 4 === 3) o.moustache = "#2a201a";
    return {
        ...o,
        ...extra
    };
};
export const townsfolk = (v = 0)=>{
    const coats = [
        "#3f6fb5",
        "#8c3b4a",
        "#5d7a3a",
        "#b5653f",
        "#2f5f6a",
        "#7b5ac9"
    ];
    const o = {
        jacket: coats[v % 6],
        pants: "#3b3f52",
        boots: "#4a3426",
        skin: SKINS[v % 4]
    };
    return v % 2 ? {
        ...o,
        hat: "bonnet",
        dress: [
            "#d9a441",
            "#c25a7a",
            "#5a8fc2"
        ][v % 3]
    } : {
        ...o,
        hat: "tophat"
    };
};
export class Pen {
    g;
    ol = 12;
    rot = null;
    constructor(g){
        this.g = g;
    }
    P(x, y) {
        if (!this.rot) return [
            x,
            y
        ];
        const r = this.rot, a = r[0], cx = r[1], cy = r[2], dx = r.length > 3 ? r[3] : 0, dy = r.length > 4 ? r[4] : 0, c = Math.cos(a), s = Math.sin(a);
        return [
            cx + (x - cx) * c - (y - cy) * s + dx,
            cy + (x - cx) * s + (y - cy) * c + dy
        ];
    }
    path(pts, close) {
        const g = this.g;
        g.beginPath();
        pts.forEach((p, i)=>{
            const [x, y] = this.P(p[0], p[1]);
            if (i) g.lineTo(x, y);
            else g.moveTo(x, y);
        });
        if (close) g.closePath();
    }
    poly(pts, fill, ol) {
        const g = this.g, w = ol ?? this.ol;
        this.path(pts, true);
        if (fill) {
            g.fillStyle = fill;
            g.fill();
        }
        if (w) {
            g.lineWidth = w;
            g.strokeStyle = INK;
            g.lineJoin = "round";
            g.stroke();
        }
    }
    ell(cx, cy, rx, ry, fill, ol, a0 = 0, a1 = 360, rot = 0) {
        this.poly(ellPts(cx, cy, rx, ry, a0, a1, rot), fill, ol);
    }
    line(pts, fill, w, ink = true) {
        const g = this.g;
        g.lineCap = "round";
        g.lineJoin = "round";
        if (ink) {
            this.path(pts, false);
            g.strokeStyle = INK;
            g.lineWidth = w + 2 * this.ol * 0.9;
            g.stroke();
        }
        this.path(pts, false);
        g.strokeStyle = fill;
        g.lineWidth = w;
        g.stroke();
    }
    stroke(pts, w, fill = INK) {
        const g = this.g;
        g.lineCap = "round";
        g.lineJoin = "round";
        this.path(pts, false);
        g.strokeStyle = fill;
        g.lineWidth = w;
        g.stroke();
    }
    arc(cx, cy, rx, ry, a0, a1, w, fill = INK) {
        const pts = [];
        for(let i = 0; i <= 24; i++)pts.push([
            cx + rx * Math.cos(rad(a0 + (a1 - a0) * i / 24)),
            cy + ry * Math.sin(rad(a0 + (a1 - a0) * i / 24))
        ]);
        this.stroke(pts, w, fill);
    }
    dot(cx, cy, r, fill = INK) {
        const [x, y] = this.P(cx, cy);
        this.g.beginPath();
        this.g.arc(x, y, r, 0, Math.PI * 2);
        this.g.fillStyle = fill;
        this.g.fill();
    }
    clip(pts, fn) {
        const g = this.g;
        g.save();
        this.path(pts, true);
        g.clip();
        fn();
        g.restore();
    }
    shadedFill(pts, base, shadow, light, R, shift = 0.45, r0 = 1.05, r1 = 1.25) {
        const g = this.g, n = pts.length;
        let cx = 0, cy = 0;
        for (const [x, y] of pts){
            cx += x / n;
            cy += y / n;
        }
        const [gx, gy] = this.P(cx + Math.cos(light) * shift * R, cy + Math.sin(light) * shift * R);
        const gr = g.createRadialGradient(gx, gy, 0, gx, gy, r1 * R);
        gr.addColorStop(0, base);
        gr.addColorStop(r0 / r1, base);
        gr.addColorStop(1, shadow);
        this.path(pts, true);
        g.fillStyle = gr;
        g.fill();
    }
    gradFill(pts, base, shadow, light, flat = 0.22) {
        const g = this.g, dx = Math.cos(light), dy = Math.sin(light), n = pts.length;
        let cx = 0, cy = 0, lo = Infinity, hi = -Infinity;
        for (const [x, y] of pts){
            cx += x / n;
            cy += y / n;
            const d = x * dx + y * dy;
            lo = Math.min(lo, d);
            hi = Math.max(hi, d);
        }
        const dc = cx * dx + cy * dy;
        const [ax, ay] = this.P(cx + dx * (hi - dc), cy + dy * (hi - dc)), [bx, by] = this.P(cx + dx * (lo - dc), cy + dy * (lo - dc));
        const gr = g.createLinearGradient(ax, ay, bx, by);
        gr.addColorStop(0, base);
        gr.addColorStop(flat, base);
        gr.addColorStop(1, shadow);
        this.path(pts, true);
        g.fillStyle = gr;
        g.fill();
    }
    inkRing(pts, w0, thick, k = 0.45, col = INK) {
        const n = pts.length;
        let cx = 0, cy = 0;
        for (const [x, y] of pts){
            cx += x / n;
            cy += y / n;
        }
        const out = [], inn = [];
        pts.forEach((q, i)=>{
            const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
            let nx = b[1] - a[1], ny = a[0] - b[0];
            const l = Math.hypot(nx, ny) || 1;
            nx /= l;
            ny /= l;
            const h = 0.5 * w0 * (1 + k * Math.cos(Math.atan2(q[1] - cy, q[0] - cx) - thick));
            out.push([
                q[0] + nx * h,
                q[1] + ny * h
            ]);
            inn.push([
                q[0] - nx * h,
                q[1] - ny * h
            ]);
        });
        const g = this.g;
        const trace = (r)=>{
            r.forEach(([x0, y0], i)=>{
                const [x, y] = this.P(x0, y0);
                if (i) g.lineTo(x, y);
                else g.moveTo(x, y);
            });
            g.closePath();
        };
        g.beginPath();
        trace(out);
        trace(inn.reverse());
        g.fillStyle = col;
        g.fill("evenodd");
    }
    band(pts, fill, w, rim, cap = "butt") {
        const g = this.g;
        g.lineCap = cap;
        g.lineJoin = "round";
        this.path(pts, false);
        g.strokeStyle = INK;
        g.lineWidth = w + 2 * rim;
        g.stroke();
        this.path(pts, false);
        g.strokeStyle = fill;
        g.lineWidth = w;
        g.stroke();
        g.lineCap = "round";
    }
}
const ellPts = (cx, cy, rx, ry, a0 = 0, a1 = 360, rot = 0, n = 48)=>{
    const r = rad(rot), pts = [];
    for(let i = 0; i <= n; i++){
        const a = rad(a0 + (a1 - a0) * i / n), x = rx * Math.cos(a), y = ry * Math.sin(a);
        pts.push([
            cx + x * Math.cos(r) - y * Math.sin(r),
            cy + x * Math.sin(r) + y * Math.cos(r)
        ]);
    }
    return pts;
};
const rrect = (x0, y0, x1, y1, r, n = 8)=>{
    const pts = [];
    for (const [cx, cy, a] of [
        [
            x1 - r,
            y0 + r,
            -90
        ],
        [
            x1 - r,
            y1 - r,
            0
        ],
        [
            x0 + r,
            y1 - r,
            90
        ],
        [
            x0 + r,
            y0 + r,
            180
        ]
    ])for(let i = 0; i <= n; i++)pts.push([
        cx + r * Math.cos(rad(a + 90 * i / n)),
        cy + r * Math.sin(rad(a + 90 * i / n))
    ]);
    return pts;
};
const taper = (p, a, b, wa, wb, col = INK)=>{
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    p.poly([
        [
            a[0] + nx * wa / 2,
            a[1] + ny * wa / 2
        ],
        [
            b[0] + nx * wb / 2,
            b[1] + ny * wb / 2
        ],
        [
            b[0] - nx * wb / 2,
            b[1] - ny * wb / 2
        ],
        [
            a[0] - nx * wa / 2,
            a[1] - ny * wa / 2
        ]
    ], col, 0);
    p.dot(a[0], a[1], wa / 2, col);
    p.dot(b[0], b[1], wb / 2, col);
};
export const blobPts = (cx, cy, B, n = 72)=>{
    const ph = [
        rnd(B.seed, 11),
        rnd(B.seed, 12),
        rnd(B.seed, 13)
    ].map((v)=>v * Math.PI * 2);
    const pts = [];
    for(let i = 0; i < n; i++){
        const t = i / n * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), e = 2 / (s < 0 ? B.nTop : B.nBot);
        let X = Math.sign(c) * Math.abs(c) ** e;
        const Y = Math.sign(s) * Math.abs(s) ** e;
        X *= (1 + B.egg * Y) * (1 + B.asym * Math.sign(X));
        const r = 1 + B.noise * (Math.cos(2 * t + ph[0]) + 0.7 * Math.cos(3 * t + ph[1]) + 0.5 * Math.cos(4 * t + ph[2]));
        const x = B.a * X * r, y = B.b * Y * r;
        pts.push([
            cx + x * Math.cos(B.rot) - y * Math.sin(B.rot),
            cy + x * Math.sin(B.rot) + y * Math.cos(B.rot)
        ]);
    }
    return pts;
};
export const headBlob = (seed, a = 118, facing = 0)=>({
        a,
        b: a * (0.94 + 0.08 * (rnd(seed, 1) - 0.5)),
        nTop: 1.75 + 0.3 * (rnd(seed, 2) - 0.5),
        nBot: 2.3 + 0.3 * (rnd(seed, 3) - 0.5),
        egg: -0.12 + 0.06 * (rnd(seed, 4) - 0.5),
        asym: (0.06 + 0.04 * rnd(seed, 5)) * (facing || (rnd(seed, 6) < 0.5 ? -1 : 1)),
        rot: rad(8 * (rnd(seed, 7) - 0.5)),
        noise: 0.008,
        seed
    });
export const thickAngle = (light)=>Math.atan2(-Math.sin(light) + 0.8, -Math.cos(light));
const DEF_LIGHT = rad(-120);
const FACE = {
    neutral: {
        eye: [
            "lid",
            "lid"
        ],
        brow: [
            0,
            -1
        ],
        mouth: "dash"
    },
    stern: {
        eye: [
            "lid",
            "lid"
        ],
        brow: [
            3,
            -2
        ],
        mouth: "frown"
    },
    grin: {
        eye: [
            "happy",
            "happy"
        ],
        brow: [
            -3,
            -3
        ],
        mouth: "grin"
    },
    laugh: {
        eye: [
            "squeeze",
            "squeeze"
        ],
        brow: [
            -4,
            -4
        ],
        mouth: "laugh"
    },
    whistle: {
        eye: [
            "dash",
            "dash"
        ],
        brow: [
            -2,
            -4
        ],
        mouth: "o"
    },
    nervous: {
        eye: [
            "small",
            "small"
        ],
        brow: [
            -3,
            2
        ],
        mouth: "wave"
    },
    shock: {
        eye: [
            "shock",
            "shock"
        ],
        brow: [
            -7,
            -6
        ],
        mouth: "O"
    },
    relief: {
        eye: [
            "happy",
            "happy"
        ],
        brow: [
            -2,
            1
        ],
        mouth: "smileWide"
    },
    relief_open: {
        eye: [
            "happy",
            "happy"
        ],
        brow: [
            -2,
            1
        ],
        mouth: "grin"
    },
    dazed: {
        eye: [
            "spiral",
            "spiral"
        ],
        brow: [
            -3,
            2
        ],
        mouth: "wave"
    },
    pained: {
        eye: [
            "squeeze",
            "lid"
        ],
        brow: [
            -3,
            2
        ],
        mouth: "teeth"
    },
    smile: {
        eye: [
            "dot",
            "dot"
        ],
        brow: [
            0,
            -1
        ],
        mouth: "smirk"
    },
    smile_closed: {
        eye: [
            "happy",
            "happy"
        ],
        brow: [
            0,
            -1
        ],
        mouth: "smile"
    },
    lick: {
        eye: [
            "dot",
            "dot"
        ],
        brow: [
            0,
            -1
        ],
        mouth: "lick"
    }
};
const halfLid = (k)=>k === "dot" || k === "small" ? "lid" : k === "lid" ? "slit" : k === "shock" ? "shockHalf" : k;
const eyeKind = (k, lid)=>lid >= 1 && k !== "happy" && k !== "squeeze" && k !== "spiral" ? "dash" : lid > 0 ? halfLid(k) : k;
const lidOf = (b)=>b === true ? 1 : Number(b) || 0;
const eye = (p, kind, x, ey, u, side, look, skin)=>{
    const lx = x + look * 3 * u, lw = 3.8 * u;
    switch(kind){
        case "dot":
            p.ell(lx, ey, 3.8 * u, 5.5 * u, INK, 0);
            break;
        case "small":
            p.ell(lx, ey, 3 * u, 4.4 * u, INK, 0);
            break;
        case "lid":
            p.ell(lx, ey - u, 7 * u, 6 * u, INK, 0, 0, 180);
            p.stroke([
                [
                    x - 9 * u,
                    ey - u
                ],
                [
                    x + 9 * u,
                    ey - u
                ]
            ], lw);
            break;
        case "slit":
            p.ell(lx, ey, 7 * u, 2.6 * u, INK, 0, 0, 180);
            p.stroke([
                [
                    x - 9 * u,
                    ey
                ],
                [
                    x + 9 * u,
                    ey
                ]
            ], lw);
            break;
        case "happy":
            p.arc(x, ey + 3 * u, 8 * u, 6 * u, 200, 340, lw);
            break;
        case "dash":
            p.stroke([
                [
                    x - 8.5 * u,
                    ey
                ],
                [
                    x + 8.5 * u,
                    ey
                ]
            ], lw);
            break;
        case "squeeze":
            p.stroke([
                [
                    x + 6 * u * side,
                    ey - 5 * u
                ],
                [
                    x - 6 * u * side,
                    ey
                ],
                [
                    x + 6 * u * side,
                    ey + 5 * u
                ]
            ], lw);
            break;
        case "shock":
        case "shockHalf":
            p.ell(x, ey, 11 * u, 11 * u, WHITE, 2.6 * u);
            p.dot(lx - side * 1.5 * u, ey + 1.5 * u, 3 * u);
            if (kind === "shockHalf") {
                p.ell(x, ey, 11 * u, 11 * u, skin, 0, 180, 360);
                p.stroke([
                    [
                        x - 11 * u,
                        ey
                    ],
                    [
                        x + 11 * u,
                        ey
                    ]
                ], 2.6 * u);
            }
            break;
        default:
            {
                const s = [];
                for(let t = 1; t < 15; t++)s.push([
                    x + Math.cos(t * 0.9) * t * 0.55 * u,
                    ey + Math.sin(t * 0.9) * t * 0.55 * u
                ]);
                p.stroke(s, 2.4 * u);
            }
    }
};
const dmouth = (p, mx, y, rx, ry, u, tongue = false)=>{
    p.ell(mx, y, rx, ry, MOUTH, 0, 0, 180);
    p.clip([
        [
            mx - rx,
            y
        ],
        [
            mx + rx,
            y
        ],
        [
            mx + rx,
            y + 3 * u
        ],
        [
            mx - rx,
            y + 3 * u
        ]
    ], ()=>p.ell(mx, y, rx, ry, WHITE, 0, 0, 180));
    if (tongue) p.ell(mx + 2 * u, y + 0.62 * ry, 0.4 * rx, 0.28 * ry, TONGUE, 0);
    p.ell(mx, y, rx, ry, null, 3 * u, 0, 180);
};
const mouth = (p, kind, mx, my, u, k = 1)=>{
    const mw = 4 * u;
    switch(kind){
        case "dash":
            p.stroke([
                [
                    mx - 5.5 * u * k,
                    my
                ],
                [
                    mx + 5.5 * u * k,
                    my - 0.8 * u
                ]
            ], mw);
            break;
        case "frown":
            p.arc(mx, my + 3 * u, 6.5 * u * k, 3.5 * u, 200, 340, mw);
            break;
        case "smirk":
            p.arc(mx + u, my - 3 * u, 7 * u * k, 4 * u, 10, 150, mw);
            break;
        case "smile":
            p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw);
            break;
        case "smileWide":
            p.arc(mx, my - 4 * u, 11 * u * k, 6 * u, 15, 165, mw);
            break;
        case "grin":
            dmouth(p, mx, my - u, 12 * u * k, 8 * u, u);
            break;
        case "laugh":
            dmouth(p, mx, my, 16 * u * k, 11 * u, u, true);
            break;
        case "o":
            p.ell(mx + 4 * u, my, 3.5 * u, 4 * u, MOUTH, 2.8 * u);
            break;
        case "O":
            p.ell(mx, my + 2 * u, 9 * u * k, 11 * u, MOUTH, 3.2 * u);
            break;
        case "wave":
            {
                const s = [];
                for(let i = 0; i <= 12; i++)s.push([
                    mx - 9 * u * k + i * 1.5 * u * k,
                    my + 1.5 * u * Math.sin(i * 1.3)
                ]);
                p.stroke(s, 3 * u);
                break;
            }
        case "teeth":
            p.poly([
                [
                    mx - 12 * u * k,
                    my - 4 * u
                ],
                [
                    mx + 12 * u * k,
                    my - 4 * u
                ],
                [
                    mx + 11 * u * k,
                    my + 4 * u
                ],
                [
                    mx - 11 * u * k,
                    my + 4 * u
                ]
            ], WHITE, 3 * u);
            for (const j of [
                -1,
                0,
                1
            ])p.stroke([
                [
                    mx + j * 6 * u * k,
                    my - 4 * u
                ],
                [
                    mx + j * 6 * u * k,
                    my + 4 * u
                ]
            ], 1.5 * u);
            break;
        case "lick":
            p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw);
            p.ell(mx + 6 * u * k, my + 3 * u, 3.6 * u, 4.6 * u, TONGUE, 2.4 * u);
            break;
    }
};
const faceFront = (p, cx, cy, W, expr, facing, look, lid, brim, skin, moustache, stout = false)=>{
    const u = W / 100, F = FACE[expr], fx = cx + 7 * u * facing;
    const ex = (F.eye[0] === "shock" ? 12 : 13) * u, ey = cy;
    for (const side of [
        -1,
        1
    ]){
        const x = fx + side * ex;
        const kind = eyeKind(F.eye[(facing ? side === facing : side > 0) ? 1 : 0], lid);
        eye(p, kind, x, ey, u, side, look, skin);
        const [dI, dO] = F.brow, by = ey - (brim ? 17 : 20) * u;
        if (kind === "shock" || kind === "shockHalf") p.arc(x, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
        else taper(p, [
            x - side * 8.5 * u,
            by + dI * u
        ], [
            x + side * 8.5 * u,
            by + dO * u
        ], 5 * u, 2.5 * u);
    }
    const mx = cx + 8 * u * facing, my = cy + 20 * u;
    mouth(p, F.mouth, mx, my, u);
    if (moustache) for (const s of [
        -1,
        1
    ])taper(p, [
        mx + s * 1.5 * u,
        cy + 12.5 * u
    ], [
        mx + s * (stout ? 19 : 15) * u,
        cy + (stout ? 10.5 : 15) * u
    ], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
    if (expr === "nervous") p.ell(cx + 40 * u * (facing || 1), cy - 22 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};
const faceSide = (p, hx, hy, W, expr, lid, brim, skin, moustache, stout = false)=>{
    const u = W / 100, F = FACE[expr], ex = hx + 27 * u, ey = hy;
    const kind = eyeKind(F.eye[1], lid);
    eye(p, kind, ex, ey, u, 1, 0.6, skin);
    const by = ey - (brim ? 17 : 20) * u, [dI, dO] = F.brow;
    if (kind === "shock" || kind === "shockHalf") p.arc(ex, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
    else taper(p, [
        ex + 8 * u,
        by + dI * u
    ], [
        ex - 7 * u,
        by - u + dO * u
    ], 5 * u, 2.5 * u);
    p.stroke([
        [
            hx + 44 * u,
            hy + 4 * u
        ],
        [
            hx + 47.5 * u,
            hy + 9 * u
        ],
        [
            hx + 43 * u,
            hy + 10 * u
        ]
    ], 3 * u);
    mouth(p, F.mouth, hx + 33 * u, hy + 21 * u, u, 0.62);
    if (moustache) taper(p, [
        hx + 41 * u,
        hy + 13.5 * u
    ], [
        hx + 25 * u,
        hy + (stout ? 11.5 : 16) * u
    ], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
    if (expr === "nervous") p.ell(hx - 30 * u, hy - 24 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};
const BONNET = "#e9cf8f", BONNET_BRIM = "#d6b46a";
const hatBehind = (p, o, H, cx, hc, light, thick, ow, side)=>{
    if (o.hat !== "bonnet") return;
    const bb = blobPts(cx - (side ? 12 : 0) * (H.a / 50), hc - 0.07 * 2 * H.b, {
        ...H,
        a: H.a * 1.17,
        b: H.b * 1.13,
        asym: 0,
        egg: 0.04,
        seed: H.seed + 3
    });
    p.shadedFill(bb, BONNET, mul(BONNET, SH_CLOTH), light, H.a * 1.17);
    p.inkRing(bb, ow * 0.85, thick);
};
const hatOn = (p, o, hp, H, cx, hc, light, seed, facing, side)=>{
    const W = 2 * H.a, HH = 2 * H.b, u = W / 100, crown = hc - H.b, ow = 0.85 * 5 * u;
    const a = H.rot + rad(4 * (rnd(seed, 20) - 0.5));
    const R = (pts)=>rotPts(pts, a, cx, hc);
    const sag = (yb, wb)=>{
        const base = [];
        for(let i = 0; i <= 12; i++){
            const t = i / 12;
            base.push([
                cx + wb * (2 * t - 1),
                yb + 3 * u * (1 - (2 * t - 1) ** 2)
            ]);
        }
        return base;
    };
    if (o.hat === "shako" || o.hat === "shako_tall") {
        const tall = o.hat === "shako_tall", yb = crown + 0.25 * HH, ht = (tall ? 0.66 : 0.56) * HH, wb = 46 * u, wt = 52 * u;
        const body = R([
            ...sag(yb, wb).reverse(),
            [
                cx - wt,
                yb - ht
            ],
            [
                cx + wt,
                yb - ht
            ]
        ]);
        p.shadedFill(body, "#3a3d47", "#24262d", light, wt, 0.4);
        if (tall) p.clip(body, ()=>p.band(R([
                [
                    cx - wt - 5 * u,
                    yb - ht + 0.07 * HH
                ],
                [
                    cx + wt + 5 * u,
                    yb - ht + 0.07 * HH
                ]
            ]), "#e8c45a", 0.06 * HH, 1.5 * u));
        p.poly(body, null, ow);
        const deg = a * 180 / Math.PI;
        if (side) {
            p.poly(R([
                [
                    cx + 36 * u,
                    yb - 1 * u
                ],
                [
                    cx + 60 * u,
                    yb + 8 * u
                ],
                [
                    cx + 34 * u,
                    yb + 6 * u
                ]
            ]), "#16171b", 2.5 * u);
            const [tx, ty] = R([
                [
                    cx + 24 * u,
                    yb - ht - 6 * u
                ]
            ])[0];
            p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u);
        } else {
            const [px, py] = R([
                [
                    cx + 3 * u * facing,
                    yb + 3 * u
                ]
            ])[0];
            p.ell(px, py, 34 * u, 0.045 * HH, "#16171b", 2.5 * u, 0, 180, deg);
            const [bx, by] = R([
                [
                    cx,
                    yb - 0.45 * ht
                ]
            ])[0];
            p.ell(bx, by, 7 * u, 6 * u, tall ? "#e8c45a" : "#c9ccd2", 2 * u, 0, 360, deg);
            p.arc(bx, by, 3.5 * u, 2.8 * u, 200, 500, 1.6 * u);
            const [tx, ty] = R([
                [
                    cx,
                    yb - ht - 6 * u
                ]
            ])[0];
            p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u);
        }
    } else if (o.hat === "cap" || o.hat === "hair") {
        const cut = crown + (o.hat === "cap" ? 0.3 : 0.42) * HH;
        const keep = (x, y)=>y < cut || side && o.hat === "hair" && x < cx - 6 * u && y < hc + 0.42 * H.b;
        const n = hp.length, startIdx = Math.max(0, hp.findIndex(([x, y], i)=>keep(x, y) && !keep(hp[(i + n - 1) % n][0], hp[(i + n - 1) % n][1])));
        const arc = [
            ...hp.slice(startIdx),
            ...hp.slice(0, startIdx)
        ].filter(([x, y])=>keep(x, y)).map(([x, y])=>[
                cx + (x - cx) * 1.03,
                hc + (y - hc) * 1.03
            ]);
        if (arc.length < 3) return;
        if (o.hat === "hair") {
            const [x0, y0] = arc[arc.length - 1], [x1, y1] = arc[0];
            for(let i = 1; i < 6; i++)arc.push([
                x0 + (x1 - x0) * i / 6,
                y0 + (y1 - y0) * i / 6 + (i % 2 ? 4 * u : 0)
            ]);
        }
        const col = o.hat === "cap" ? o.cap : o.hair;
        p.shadedFill(arc, col, mul(col, SH_FELT), light, H.a, 0.35);
        p.poly(arc, null, ow);
        if (o.hat === "hair") {
            const s = side ? -1 : facing || 1;
            p.stroke([
                [
                    cx + s * 10 * u,
                    cut - 30 * u
                ],
                [
                    cx + s * 2 * u,
                    cut - 12 * u
                ]
            ], 1.2 * u);
        }
        if (o.hat === "cap") {
            const deg = a * 180 / Math.PI;
            if (side) p.poly(R([
                [
                    cx + 40 * u,
                    cut - 2 * u
                ],
                [
                    cx + 74 * u,
                    cut + 4 * u
                ],
                [
                    cx + 40 * u,
                    cut + 6 * u
                ]
            ]), shade(col, 0.8), ow);
            else {
                const s = facing || (rnd(seed, 21) < 0.5 ? -1 : 1), [px, py] = R([
                    [
                        cx + s * 4 * u,
                        cut + 1.5 * u
                    ]
                ])[0];
                p.ell(px, py, 32 * u, 0.06 * HH, shade(col, 0.8), ow, 0, 180, deg);
            }
        }
    } else if (o.hat === "tophat") {
        const yb = crown + 0.22 * HH, ht = 0.8 * HH, wb = 0.31 * W, wt = 0.33 * W, col = "#2e2a36";
        const body = R([
            ...sag(yb, wb).reverse(),
            [
                cx - wt,
                yb - ht
            ],
            [
                cx + wt,
                yb - ht
            ]
        ]);
        p.shadedFill(body, col, mul(col, SH_FELT), light, wt, 0.4);
        p.clip(body, ()=>p.band(R([
                [
                    cx - wt - 4 * u,
                    yb - 0.13 * HH
                ],
                [
                    cx + wt + 4 * u,
                    yb - 0.13 * HH
                ]
            ]), shade(o.jacket, 0.9), 0.14 * HH, 0.8 * u));
        p.poly(body, null, ow);
        const [bx, by] = R([
            [
                cx,
                yb + 1 * u
            ]
        ])[0];
        p.ell(bx, by, 0.45 * W, 0.05 * HH, "#1d1b22", ow, 0, 360, a * 180 / Math.PI);
    } else if (o.hat === "bonnet") {
        const [bx, by] = R([
            [
                cx + (side ? 6 * u : 0),
                crown + 0.16 * HH
            ]
        ])[0];
        p.arc(bx, by, 0.5 * W, 0.2 * HH, 200, 340, 7 * u, BONNET_BRIM);
        p.arc(bx, by, 0.5 * W + 3.5 * u, 0.2 * HH + 3.5 * u, 200, 340, 1.2 * u);
        const cy = hc + H.b * 0.98;
        p.stroke([
            [
                cx - 14 * u,
                cy - 4 * u
            ],
            [
                cx,
                cy + 2 * u
            ],
            [
                cx + 14 * u,
                cy - 4 * u
            ]
        ], 2 * u, BONNET_BRIM);
    }
};
const BUILD = {
    adult: {
        a: 118,
        torso: 1.1,
        legs: 1.4,
        tw: 0.8
    },
    stout: {
        a: 118,
        torso: 1.15,
        legs: 1.32,
        tw: 0.92
    },
    kid: {
        a: 112,
        torso: 0.85,
        legs: 1.0,
        tw: 0.72
    }
};
const footStroke = (p, a, b, w, col)=>{
    if (col !== INK) p.stroke([
        a,
        b
    ], w + 3, INK);
    p.stroke([
        a,
        b
    ], w, col);
};
export const bodyFront = (p, o, opts)=>{
    const { phase = 0, expr = "neutral", mode = "march", look = 0, blink = false, lift = 60, prop = null, tilt = 0, headTilt = 0, wave, light = DEF_LIGHT, facing = 0, seed = 1 } = opts;
    const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
    const H = headBlob(seed, Bd.a, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
    const tall = (1 + Bd.torso + Bd.legs) * HH, sole = 975;
    const bob = mode === "march" ? 0.025 * tall * Math.cos(2 * two * phase) : mode === "stroll" ? 0.015 * tall * Math.cos(2 * two * phase) : 0;
    const torsoBot = mode === "sit" ? sole - 0.2 * HH : sole - Bd.legs * HH + bob;
    const chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hipY = torsoBot - 0.12 * HH;
    const thick = thickAngle(light), ow = 5 * u;
    const legCol = mix(o.pants, INK, 0.55), armCol = mix(o.jacket, INK, 0.5), footCol = o.boots;
    const legW = 5.8 * u, footW = 7.5 * u;
    p.rot = null;
    if (mode === "sit") {
        for (const side of [
            -1,
            1
        ]){
            const h = [
                300 + side * 15 * u,
                hipY
            ], k = [
                300 + side * 36 * u,
                hipY + 0.2 * HH
            ], f = [
                300 + side * 44 * u,
                sole - 8 * u
            ];
            p.stroke(curve(h, k, f), legW, legCol);
            footStroke(p, [
                f[0] - side * 2 * u,
                f[1]
            ], [
                f[0] + side * 12 * u,
                f[1] - 5 * u
            ], footW, footCol);
        }
    } else if (mode === "fall") {
        const legs = [
            [
                [
                    300 - 15 * u,
                    hipY
                ],
                [
                    300 - 46 * u,
                    hipY + 0.5 * HH
                ],
                [
                    300 - 70 * u,
                    hipY + 0.72 * HH
                ]
            ],
            [
                [
                    300 + 15 * u,
                    hipY
                ],
                [
                    300 + 50 * u,
                    hipY + 0.45 * HH
                ],
                [
                    300 + 76 * u,
                    hipY + 0.22 * HH
                ]
            ]
        ];
        legs.forEach(([h, k, f], i)=>{
            p.stroke(curve(h, k, f), legW, legCol);
            footStroke(p, f, [
                f[0] + (i ? 14 : -14) * u,
                f[1] + (i ? -6 : 4) * u
            ], footW, footCol);
        });
    } else if (o.dress) {
        for (const side of [
            -1,
            1
        ]){
            const fx = 300 + side * 12 * u, fy = sole - 4 * u;
            p.stroke([
                [
                    fx,
                    sole - 0.4 * HH
                ],
                [
                    fx + side * u,
                    fy
                ]
            ], legW, legCol);
            footStroke(p, [
                fx - side * 3 * u,
                fy
            ], [
                fx + side * 12 * u,
                fy + u
            ], footW, footCol);
        }
    } else {
        const L = mode === "march" ? lift * 1.25 : mode === "stroll" ? lift * 0.55 : 0;
        for (const [side, ph] of [
            [
                -1,
                0
            ],
            [
                1,
                0.5
            ]
        ]){
            const up = Math.max(0, Math.sin(two * (phase + ph))) * L;
            const hx = 300 + side * 15 * u, fx = 300 + side * 22 * u, fy = sole - 4 * u - up;
            const k = [
                (hx + fx) / 2 + side * (1.5 * u + up * 0.16),
                (hipY + fy) / 2 - up * 0.08
            ];
            p.stroke(curve([
                hx,
                hipY
            ], k, [
                fx,
                fy
            ]), legW, legCol);
            footStroke(p, [
                fx - side * 3 * u,
                fy
            ], [
                fx + side * 13 * u,
                fy + 0.5 * u
            ], footW, footCol);
        }
    }
    const sway = mode === "march" ? 1.6 * Math.sin(two * phase) : mode === "stroll" ? 1.0 * Math.sin(two * phase) : 0;
    const A = tilt + sway;
    p.rot = A ? [
        rad(A),
        300,
        hipY
    ] : null;
    const dress = !!o.dress && mode !== "sit" && mode !== "fall";
    const T = {
        a: Bd.tw / 2 * W / 1.06,
        b: 0.5 * (torsoBot - (chin - 0.25 * HH)),
        nTop: 2.2,
        nBot: 2.6,
        egg: o.build === "stout" ? 0.17 : 0.12,
        asym: 0.04 * facing,
        rot: 0,
        noise: 0.006,
        seed: seed + 7
    };
    const tcx = 300 + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
    const sh = (side)=>[
            tcx + side * 0.85 * T.a,
            chin + 0.12 * HH
        ];
    const hang = (side, fwd)=>{
        const S = sh(side), ex = tcx + side * (1.12 * T.a + 4 * u);
        const hx = ex + side * 3 * u - side * 6 * u * Math.max(0, fwd) + side * 4 * u * Math.max(0, -fwd);
        return [
            S,
            [
                ex,
                S[1] + 0.48 * HH
            ],
            [
                hx,
                chin + 1.04 * HH - Math.abs(fwd) * 9 * u
            ]
        ];
    };
    const sw = mode === "march" || mode === "stroll" ? Math.sin(two * phase) : 0;
    const R0 = [
        300 + 47 * u,
        torsoBot + 0.12 * HH
    ], R1 = [
        300 + 64 * u,
        crown - 0.32 * HH
    ];
    const rifle = !!o.rifle && (mode === "march" || mode === "stand" || mode === "stroll");
    const arms = [];
    if (mode === "sit") for (const side of [
        -1,
        1
    ])arms.push({
        pts: [
            sh(side),
            [
                tcx + side * (1.1 * T.a + 6 * u),
                sh(side)[1] + 0.4 * HH
            ],
            [
                tcx + side * (1.2 * T.a + 10 * u),
                torsoBot + 0.04 * HH
            ]
        ],
        front: false
    });
    else if (mode === "fall") for (const side of [
        -1,
        1
    ])arms.push({
        pts: [
            sh(side),
            [
                tcx + side * (1.15 * T.a + 12 * u),
                sh(side)[1] - 0.25 * HH
            ],
            [
                tcx + side * (1.3 * T.a + 24 * u),
                sh(side)[1] - 0.68 * HH
            ]
        ],
        front: false
    });
    else {
        arms.push({
            pts: prop === "shako" ? hang(-1, 0) : hang(-1, -sw),
            front: false
        });
        if (rifle) {
            const G = lerp2(R0, R1, 0.1);
            arms.push({
                pts: [
                    sh(1),
                    [
                        tcx + 1.12 * T.a + 5 * u,
                        sh(1)[1] + 0.45 * HH
                    ],
                    G
                ],
                front: false
            });
        } else if (wave !== undefined) {
            const S = sh(1);
            arms.push({
                pts: [
                    S,
                    [
                        tcx + 1.1 * T.a + 10 * u + 3 * u * wave,
                        S[1] - 0.22 * HH
                    ],
                    [
                        tcx + 1.18 * T.a + 16 * u + 12 * u * wave,
                        S[1] - 0.6 * HH
                    ]
                ],
                front: false
            });
        } else if (prop === "icecream") {
            const S = sh(1);
            arms.push({
                pts: [
                    S,
                    [
                        tcx + 1.05 * T.a + 4 * u,
                        S[1] + 0.45 * HH
                    ],
                    [
                        tcx + 0.5 * T.a,
                        S[1] + 0.4 * HH
                    ]
                ],
                front: true
            });
        } else if (Array.isArray(prop)) {
            const S = sh(1), k = clamp(prop[1], 0, 1);
            const E = lerp2([
                tcx + 1.1 * T.a + 10 * u,
                S[1] - 0.15 * HH
            ], [
                tcx + 1.2 * T.a + 10 * u,
                S[1] + 0.3 * HH
            ], k);
            const Hd = lerp2([
                tcx + 1.15 * T.a + 14 * u,
                S[1] - 0.55 * HH
            ], [
                tcx + 1.45 * T.a + 22 * u,
                S[1] + 0.35 * HH
            ], k);
            arms.push({
                pts: [
                    S,
                    E,
                    Hd
                ],
                front: true
            });
        } else arms.push({
            pts: hang(1, sw),
            front: false
        });
    }
    const drawArm = (a)=>{
        p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, armCol);
        p.dot(a.pts[2][0], a.pts[2][1], 5.5 * u);
    };
    if (rifle) {
        p.band([
            R0,
            R1
        ], "#7a4b2a", 5 * u, 1.5 * u, "round");
        p.band([
            lerp2(R0, R1, 0.6),
            R1
        ], "#8d949c", 2.4 * u, 1.2 * u, "round");
    }
    if (o.sword && mode !== "sit") {
        const s0 = [
            tcx - 0.75 * T.a,
            torsoBot - 0.2 * HH
        ];
        p.band([
            s0,
            [
                s0[0] - Math.sin(rad(25)) * 0.8 * HH,
                s0[1] + Math.cos(rad(25)) * 0.8 * HH
            ]
        ], "#c9ccd2", 3 * u, 1.2 * u, "round");
    }
    for (const a of arms)if (!a.front) drawArm(a);
    if (dress) {
        const D = {
            a: 0.5 * W * 0.98,
            b: 0.5 * (sole - 0.35 * HH - (chin - 0.2 * HH)),
            nTop: 2.0,
            nBot: 3.0,
            egg: 0.35,
            asym: 0.03 * facing,
            rot: 0,
            noise: 0.006,
            seed: seed + 9
        };
        const dp = blobPts(300, sole - 0.35 * HH - D.b, D);
        p.gradFill(dp, o.dress, mul(o.dress, SH_CLOTH), light);
        p.inkRing(dp, ow, thick);
        const Sw = {
            a: 0.37 * W,
            b: 0.3 * HH,
            nTop: 2.2,
            nBot: 2.4,
            egg: 0.1,
            asym: 0,
            rot: 0,
            noise: 0.006,
            seed: seed + 8
        };
        const sp = blobPts(300, chin + 0.12 * HH, Sw);
        p.gradFill(sp, o.jacket, mul(o.jacket, SH_CLOTH), light);
        p.inkRing(sp, ow * 0.9, thick);
    } else {
        p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
        p.clip(tp, ()=>{
            if (o.belt) {
                for (const s of [
                    -1,
                    1
                ])p.band([
                    [
                        tcx - s * 0.75 * T.a,
                        chin - 0.05 * HH
                    ],
                    [
                        tcx + s * 0.8 * T.a,
                        torsoBot - 0.1 * HH
                    ]
                ], o.belt, 5.5 * u, 1.8 * u);
                const xc = tcx + 0.025 * T.a, yc = chin - 0.05 * HH + (torsoBot - 0.1 * HH - (chin - 0.05 * HH)) * (0.75 / 1.55);
                p.poly([
                    [
                        xc - 3.5 * u,
                        yc - 3.5 * u
                    ],
                    [
                        xc + 3.5 * u,
                        yc - 3.5 * u
                    ],
                    [
                        xc + 3.5 * u,
                        yc + 3.5 * u
                    ],
                    [
                        xc - 3.5 * u,
                        yc + 3.5 * u
                    ]
                ], "#d9dde0", 1.5 * u);
            }
            if (o.sash) p.band([
                [
                    tcx - 1.3 * T.a,
                    torsoBot - 0.32 * HH
                ],
                [
                    tcx + 1.3 * T.a,
                    torsoBot - 0.32 * HH
                ]
            ], o.sash, 0.13 * HH, 1.8 * u);
            for(let i = 0; i < 4; i++){
                const y = chin + 0.12 * HH + i * 0.2 * HH;
                if (o.sash && Math.abs(y - (torsoBot - 0.32 * HH)) < 0.08 * HH) continue;
                p.dot(tcx + 2 * u * facing, y, 2.2 * u + 0.8 * u, INK);
                p.dot(tcx + 2 * u * facing, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
            }
        });
        if (o.sash) {
            const s = facing || 1;
            p.poly([
                [
                    tcx + s * 0.55 * T.a,
                    torsoBot - 0.3 * HH
                ],
                [
                    tcx + s * 0.75 * T.a,
                    torsoBot + 0.05 * HH
                ],
                [
                    tcx + s * 0.45 * T.a,
                    torsoBot + 0.02 * HH
                ]
            ], o.sash, 1.6 * u);
        }
        p.inkRing(tp, ow, thick);
    }
    for (const a of arms)if (a.front) {
        drawArm(a);
        const [hx, hy] = a.pts[2];
        if (prop === "icecream") {
            p.poly([
                [
                    hx - 8 * u,
                    hy - 12 * u
                ],
                [
                    hx + 8 * u,
                    hy - 12 * u
                ],
                [
                    hx,
                    hy + 7 * u
                ]
            ], "#e0a35a", 1.8 * u);
            p.ell(hx, hy - 19 * u, 11 * u, 10 * u, "#f7c6d9", 2.2 * u);
            p.dot(hx, hy, 5.5 * u);
        } else if (Array.isArray(prop)) {
            const ang = rad(-70 + 105 * clamp(prop[1], 0, 1));
            const Rh = (pts)=>rotPts(pts, ang, hx, hy);
            p.band(Rh([
                [
                    hx,
                    hy + 12 * u
                ],
                [
                    hx,
                    hy - 44 * u
                ]
            ]), "#8a5a34", 5 * u, 1.5 * u, "round");
            p.poly(Rh([
                [
                    hx - 12 * u,
                    hy - 58 * u
                ],
                [
                    hx + 20 * u,
                    hy - 58 * u
                ],
                [
                    hx + 20 * u,
                    hy - 42 * u
                ],
                [
                    hx - 12 * u,
                    hy - 42 * u
                ]
            ]), "#7d848c", 2.2 * u);
            p.dot(hx, hy, 5.5 * u);
        }
    }
    if (prop === "shako") {
        const [hx, hy] = arms[0].pts[2];
        p.poly([
            [
                hx - 14 * u,
                hy + 3 * u
            ],
            [
                hx + 14 * u,
                hy + 3 * u
            ],
            [
                hx + 16 * u,
                hy + 30 * u
            ],
            [
                hx - 16 * u,
                hy + 30 * u
            ]
        ], "#3a3d47", 2.2 * u);
        p.ell(hx, hy + 31 * u, 3.5 * u, 3.5 * u, "#2b7a4b", 1.5 * u);
        p.dot(hx, hy, 5.5 * u);
    }
    const Ah = A + headTilt, [cpx, cpy] = rotAbout([
        300,
        chin
    ], rad(A), [
        300,
        hipY
    ]);
    p.rot = Ah ? [
        rad(Ah),
        300,
        chin,
        cpx - 300,
        cpy - chin
    ] : null;
    hatBehind(p, o, H, 300, hc, light, thick, ow, false);
    const hp = blobPts(300, hc, H);
    p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
    p.inkRing(hp, ow, thick);
    hatOn(p, o, hp, H, 300, hc, light, seed, facing, false);
    const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap";
    faceFront(p, 300, hc, W, expr, facing, look, lid, brim, skin, o.moustache, o.build === "stout");
    p.rot = null;
};
const ik = (hip, ank, l1, l2)=>{
    const dx = ank[0] - hip[0], dy = ank[1] - hip[1], d = clamp(Math.hypot(dx, dy), 1, l1 + l2 - 0.01);
    const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), k = Math.atan2(dy, dx) - A;
    return [
        hip[0] + l1 * Math.cos(k),
        hip[1] + l1 * Math.sin(k)
    ];
};
const SWING_HIP = 733;
export const bodySide = (p, o, opts)=>{
    const { phase = 0, expr = "neutral", mode = "march", blink = false, stomp = 1, pose = 0, stride = 1, light = DEF_LIGHT, seed = 1 } = opts;
    const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
    const H = {
        ...headBlob(seed, Bd.a, 1),
        asym: 0.12,
        rot: rad(3 + 3 * (rnd(seed, 7) - 0.5))
    };
    const W = 2 * H.a, HH = 2 * H.b, u = W / 100, sole = 975, ankY = sole - 4 * u;
    const thick = thickAngle(light), ow = 5 * u;
    const legLen = (Bd.legs + 0.12) * HH - 4 * u, l1 = legLen / 2, l2 = legLen / 2;
    const nearCol = mix(o.pants, INK, 0.55), farCol = mix(o.pants, INK, 0.75), footCol = o.boots;
    const legs = [];
    let hipY = ankY - legLen * 0.995, lean = 0, nearFwd = 0;
    if (mode === "march") {
        const S = 370 * stride, liftH = Math.max(22, 40 + 70 * (stomp - 1));
        const st = (ph)=>{
            const c = ((phase + ph) % 1 + 1) % 1;
            if (c < 0.5) {
                const s = c / 0.5;
                return {
                    x: S / 2 - S * s,
                    h: 0,
                    stance: true,
                    s
                };
            }
            const s = (c - 0.5) / 0.5;
            return {
                x: -S / 2 + S * s - S / Math.PI * Math.sin(2 * Math.PI * s),
                h: liftH * Math.sin(Math.PI * s),
                stance: false,
                s
            };
        };
        const nL = st(0), fL = st(0.5), stance = nL.stance ? nL : fL;
        const Leff = legLen * (1 - 0.035 * Math.sin(Math.PI * stance.s));
        hipY = ankY - Math.sqrt(Math.max(1, Leff * Leff - stance.x * stance.x));
        for (const [L, near] of [
            [
                fL,
                false
            ],
            [
                nL,
                true
            ]
        ])legs.push({
            ank: [
                300 + L.x,
                ankY - L.h
            ],
            pitch: L.stance ? 0 : rad(35 * Math.sin(Math.PI * L.s) * (1 - 1.6 * L.s)),
            near
        });
        lean = 4 + 3 * Math.cos(2 * two * phase);
        nearFwd = nL.x / (S / 2);
    } else if (mode === "push") {
        hipY = ankY - 0.87 * legLen;
        legs.push({
            ank: [
                300 - 0.5 * legLen,
                ankY
            ],
            pitch: rad(-8),
            near: false
        }, {
            ank: [
                300 + 0.32 * legLen,
                ankY
            ],
            pitch: 0,
            near: true
        });
        lean = 14 * pose;
    } else if (mode === "swing") {
        hipY = SWING_HIP;
        const a = rad(60 * pose);
        for (const [dx, near] of [
            [
                -6,
                false
            ],
            [
                0,
                true
            ]
        ]){
            const knee = [
                300 + l1 * 0.98 + dx * u,
                hipY + 6 * u
            ];
            legs.push({
                ank: [
                    knee[0] + l2 * Math.sin(a),
                    knee[1] + l2 * Math.cos(a)
                ],
                pitch: -a * 0.5,
                near
            });
        }
    } else {
        legs.push({
            ank: [
                300 - 4 * u,
                ankY
            ],
            pitch: 0,
            near: false
        }, {
            ank: [
                300 + 4 * u,
                ankY
            ],
            pitch: 0,
            near: true
        });
    }
    const torsoBot = hipY + 0.12 * HH, chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hip = [
        300,
        hipY
    ];
    p.rot = null;
    for (const L of legs){
        const knee = mode === "swing" ? [
            300 + l1 * 0.98 + (L.near ? 0 : -6 * u),
            hipY + 6 * u
        ] : ik(hip, L.ank, l1, l2);
        const hp0 = [
            300 + (L.near ? 0 : -5 * u),
            hipY
        ];
        p.stroke([
            hp0,
            knee,
            L.ank
        ], 5.8 * u, L.near ? nearCol : farCol);
        const c = Math.cos(L.pitch), s = Math.sin(L.pitch);
        footStroke(p, [
            L.ank[0] - 3 * u * c,
            L.ank[1] - 3 * u * s
        ], [
            L.ank[0] + 13 * u * c,
            L.ank[1] + 13 * u * s + 0.5 * u
        ], 7.5 * u, L.near ? footCol : footCol === INK ? INK : shade(footCol, 0.82));
    }
    p.rot = lean ? [
        rad(lean),
        300,
        hipY
    ] : null;
    const T = {
        a: (o.build === "stout" ? 0.36 : 0.31) * W,
        b: 0.5 * (torsoBot - (chin - 0.25 * HH)),
        nTop: 2.2,
        nBot: 2.5,
        egg: 0.1,
        asym: 0.06,
        rot: 0,
        noise: 0.006,
        seed: seed + 7
    };
    const tcx = 300 + 2 * u, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
    const armCol = mix(o.jacket, INK, 0.5), farArm = mix(o.jacket, INK, 0.68);
    const S = [
        tcx + 0.05 * T.a,
        chin + 0.14 * HH
    ], aLen = 0.95 * HH;
    const swingArm = (ang)=>{
        const e = [
            S[0] + Math.sin(ang) * aLen * 0.5,
            S[1] + Math.cos(ang) * aLen * 0.5
        ], a2 = ang + rad(16) * Math.sign(ang || 1);
        return [
            S,
            e,
            [
                e[0] + Math.sin(a2) * aLen * 0.5,
                e[1] + Math.cos(a2) * aLen * 0.5
            ]
        ];
    };
    const rifle = !!o.rifle && (mode === "march" || mode === "stand");
    const B0 = [
        tcx + 0.72 * T.a,
        chin + 0.58 * HH
    ], B1 = [
        tcx - 0.95 * T.a - 22 * u,
        crown - 0.4 * HH
    ];
    let near, far;
    if (mode === "swing") {
        near = [
            S,
            [
                S[0] + 12 * u,
                S[1] - 0.16 * HH
            ],
            [
                300 + 6 * u,
                chin - 0.3 * HH
            ]
        ];
        far = [
            S,
            [
                S[0] + 8 * u,
                S[1] - 0.18 * HH
            ],
            [
                300 + 2 * u,
                chin - 0.36 * HH
            ]
        ];
    } else if (mode === "push") {
        const reach = 0.55 * HH + 0.45 * HH * pose;
        let hN = [
            S[0] + reach,
            S[1] + 0.06 * HH
        ];
        if (opts.hand) {
            const th = -rad(lean), dx = opts.hand[0] - 300, dy = opts.hand[1] - hipY;
            const tg = [
                300 + dx * Math.cos(th) - dy * Math.sin(th),
                hipY + dx * Math.sin(th) + dy * Math.cos(th)
            ];
            hN = [
                hN[0] + (tg[0] - hN[0]) * pose,
                hN[1] + (tg[1] - hN[1]) * pose
            ];
        }
        near = [
            S,
            [
                (S[0] + hN[0]) / 2,
                (S[1] + hN[1]) / 2 + 0.06 * HH
            ],
            hN
        ];
        far = [
            S,
            [
                (S[0] + hN[0]) / 2 - 4 * u,
                (S[1] + hN[1]) / 2 - 0.02 * HH
            ],
            [
                hN[0] - 6 * u,
                hN[1] - 0.08 * HH
            ]
        ];
    } else if (rifle) {
        near = [
            S,
            [
                S[0] - 4 * u,
                S[1] + 0.42 * HH
            ],
            B0
        ];
        far = mode === "march" ? swingArm(rad(30) * nearFwd) : swingArm(0);
    } else {
        near = swingArm(rad(-30) * nearFwd);
        far = mode === "march" ? swingArm(rad(30) * nearFwd) : null;
    }
    if (far) {
        p.stroke(curve(far[0], far[1], far[2]), 5.2 * u, farArm);
        p.dot(far[2][0], far[2][1], 5.5 * u);
    }
    p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
    p.clip(tp, ()=>{
        if (o.belt) p.band([
            [
                tcx - 0.65 * T.a,
                chin - 0.05 * HH
            ],
            [
                tcx + 0.75 * T.a,
                torsoBot - 0.1 * HH
            ]
        ], o.belt, 5.5 * u, 1.8 * u);
        if (o.sash) p.band([
            [
                tcx - 1.3 * T.a,
                torsoBot - 0.32 * HH
            ],
            [
                tcx + 1.3 * T.a,
                torsoBot - 0.32 * HH
            ]
        ], o.sash, 0.13 * HH, 1.8 * u);
        if (!o.dress) for(let i = 0; i < 3; i++){
            const y = chin + 0.16 * HH + i * 0.24 * HH;
            p.dot(tcx + 0.8 * T.a, y, 3 * u, INK);
            p.dot(tcx + 0.8 * T.a, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
        }
    });
    p.inkRing(tp, ow, thick);
    if (rifle) {
        p.band([
            B0,
            B1
        ], "#7a4b2a", 5 * u, 1.5 * u, "round");
        p.band([
            lerp2(B0, B1, 0.6),
            B1
        ], "#8d949c", 2.4 * u, 1.2 * u, "round");
    }
    p.stroke(curve(near[0], near[1], near[2]), 5.2 * u, armCol);
    p.dot(near[2][0], near[2][1], 5.5 * u);
    const hx = 300 + 4 * u;
    hatBehind(p, o, H, hx, hc, light, thick, ow, true);
    const hp = blobPts(hx, hc, H);
    p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
    p.inkRing(hp, ow, thick);
    hatOn(p, o, hp, H, hx, hc, light, seed, 1, true);
    const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap";
    faceSide(p, hx, hc, W, expr, lid, brim, skin, o.moustache, o.build === "stout");
    p.rot = null;
};
export const swingKid = (p, o, kick, expr, light = DEF_LIGHT, blink = 0)=>{
    const rope = 1830, k = 1.1, HH = 2 * headBlob(5, BUILD[o.build ?? "adult"].a, 1).b;
    const seat = rope + 18, x0 = 150, x1 = 550;
    p.line([
        [
            350,
            20
        ],
        [
            x0 + 16,
            seat + 4
        ]
    ], "#a07a4c", 10);
    p.poly(rrect(x0, seat, x1, seat + 36, 10), "#b5653f", 9);
    const g = p.g;
    g.save();
    g.translate(350 - 300 * k, rope + 18 - (SWING_HIP + 0.12 * HH) * k);
    g.scale(k, k);
    bodySide(new Pen(g), o, {
        expr,
        mode: "swing",
        pose: kick,
        light,
        seed: 5,
        blink
    });
    g.restore();
    p.line([
        [
            350,
            20
        ],
        [
            x1 - 16,
            seat + 4
        ]
    ], "#a07a4c", 10);
};
export const fxNote = (p, kind, col = "#1f2a44")=>{
    p.ell(70, 200, 46, 34, col, 8, 0, 360, -20);
    p.stroke([
        [
            110,
            190
        ],
        [
            110,
            40
        ]
    ], 14);
    if (kind === 0) p.poly([
        [
            110,
            40
        ],
        [
            170,
            70
        ],
        [
            170,
            110
        ],
        [
            110,
            82
        ]
    ], col, 8);
    else {
        p.ell(150, 170, 40, 30, col, 8, 0, 360, -20);
        p.stroke([
            [
                186,
                160
            ],
            [
                186,
                20
            ]
        ], 14);
        p.poly([
            [
                110,
                40
            ],
            [
                186,
                20
            ],
            [
                186,
                50
            ],
            [
                110,
                70
            ]
        ], col, 8);
    }
};
export const fxBurst = (p, t, col = "#fff3b0", rays = 10, r0 = 40, r1 = 230)=>{
    const c = 250, e = 1 - (1 - t) ** 3;
    for(let i = 0; i < rays; i++){
        const a = rad(i * 360 / rays + 7 * (i % 2)), ra = r0 + (r1 - r0) * e * (0.75 + 0.25 * (i % 2));
        p.poly([
            [
                c + r0 * 0.5 * Math.cos(a + 0.18),
                c + r0 * 0.5 * Math.sin(a + 0.18)
            ],
            [
                c + ra * Math.cos(a),
                c + ra * Math.sin(a)
            ],
            [
                c + r0 * 0.5 * Math.cos(a - 0.18),
                c + r0 * 0.5 * Math.sin(a - 0.18)
            ]
        ], col, Math.max(3, 8 * (1 - t)));
    }
    if (t < 0.5) p.ell(c, c, r0 * (1.4 - t), r0 * (1.4 - t), WHITE, 8);
};
export const fxSplash = (p, t)=>{
    const c = 400, size = 800, rise = Math.sin(Math.min(1, t * 1.3) * Math.PI);
    const blue = "#bfe8ff", deep = "#6cc0f0";
    if (rise > 0.02) {
        const pts = [];
        for(let i = 0; i < 19; i++){
            const h = (i % 2 ? 260 : 130) * rise * (0.7 + 0.3 * Math.sin(i * 1.7));
            pts.push([
                c - 330 + 660 * i / 18,
                size - 120 - h
            ]);
        }
        p.poly([
            ...pts,
            [
                c + 330,
                size - 90
            ],
            [
                c - 330,
                size - 90
            ]
        ], blue, 10);
        p.ell(c, size - 100, 360, 46, deep, 10);
    }
    for(let i = 0; i < 8; i++){
        const a = rad(200 + i * 18), d = 120 + 380 * t, y = size - 160 + d * Math.sin(a) + 520 * t * t, r = 26 * (1 - t) + 6;
        if (t > 0.08 && y < size - 40) p.ell(c + d * Math.cos(a), y, r, r * 1.25, blue, 7);
    }
};
export const fxPuff = (p, t)=>{
    for(let i = 0; i < 5; i++){
        const a = rad(160 + i * 55), d = 40 + 70 * t, r = (34 + 20 * (i % 2)) * (1 - 0.6 * t);
        p.ell(150 + d * Math.cos(a), 180 + d * 0.45 * Math.sin(a), r, r * 0.8, `rgba(238,225,205,${(1 - t).toFixed(3)})`, 0);
    }
};
export const fxStars = (p, t)=>{
    for(let i = 0; i < 4; i++){
        const a = t * Math.PI * 2 + i * Math.PI / 2, x = 210 + 150 * Math.cos(a), y = 110 + 40 * Math.sin(a), pts = [];
        for(let k = 0; k < 10; k++){
            const r = k % 2 ? 14 : 34, b = rad(k * 36 - 90);
            pts.push([
                x + r * Math.cos(b),
                y + r * Math.sin(b)
            ]);
        }
        p.poly(pts, "#ffd84a", 6);
    }
};
export const fxCreak = (p, t)=>{
    const j = 6 * Math.sin(t * 40);
    for (const a of [
        -30,
        0,
        30
    ]){
        const b = rad(a - 90);
        p.stroke([
            [
                150 + 70 * Math.cos(b) + j,
                230 + 70 * Math.sin(b)
            ],
            [
                150 + 100 * Math.cos(b) + 10 + j,
                230 + 100 * Math.sin(b)
            ],
            [
                150 + 130 * Math.cos(b) + j,
                230 + 130 * Math.sin(b)
            ]
        ], 10);
    }
};
export const fxRing = (p, t)=>{
    const g = p.g;
    for(let k = 0; k < 3; k++){
        const u = t - k * 0.22;
        if (u <= 0 || u >= 1) continue;
        g.beginPath();
        g.ellipse(300, 300, 60 + 230 * u, 60 + 230 * u, 0, 0, Math.PI * 2);
        g.strokeStyle = k === 0 ? "#f6fcff" : "#cfe8fa";
        g.lineWidth = 9 * (1 - u) + 3;
        g.stroke();
    }
};
export const fxSign = (p)=>{
    const g = p.g, RED = "#d42f2f";
    p.poly(rrect(14, 14, 686, 506, 40), "#f6ecd2", 0);
    p.poly(rrect(14, 14, 686, 506, 40), null, 14);
    p.poly(rrect(70, 352, 630, 384, 8), "#8a5a3a", 9);
    g.beginPath();
    g.moveTo(112, 470);
    g.quadraticCurveTo(350, 300, 588, 470);
    g.strokeStyle = INK;
    g.lineWidth = 16;
    g.lineCap = "round";
    g.stroke();
    for (const x of [
        88,
        612
    ])p.poly(rrect(x - 16, 384, x + 16, 470, 4), "#8a5a3a", 9);
    for (const x of [
        150,
        278,
        406,
        534
    ]){
        p.poly(rrect(x - 30, 150, x + 30, 214, 14), "#357650", 9);
        p.stroke([
            [
                x - 8,
                210
            ],
            [
                x + 34,
                262
            ],
            [
                x + 46,
                338
            ]
        ], 15, INK);
        p.stroke([
            [
                x + 6,
                210
            ],
            [
                x - 12,
                274
            ],
            [
                x - 36,
                336
            ]
        ], 15, INK);
        p.poly(rrect(x + 30, 330, x + 74, 350, 9), INK, 0);
        p.poly(rrect(x - 52, 328, x - 8, 348, 9), INK, 0);
    }
    for (const [a, b] of [
        [
            [
                96,
                70
            ],
            [
                604,
                452
            ]
        ],
        [
            [
                604,
                70
            ],
            [
                96,
                452
            ]
        ]
    ]){
        p.stroke([
            a,
            b
        ], 58, "#ffffff");
        p.stroke([
            a,
            b
        ], 42, RED);
    }
};
export const fxCloud = (p, seed)=>{
    const blobs = [
        [
            150,
            190,
            80
        ],
        [
            250,
            150,
            105
        ],
        [
            360,
            160,
            95
        ],
        [
            450,
            195,
            70
        ],
        [
            300,
            210,
            90
        ]
    ];
    for (const [x, y, r] of blobs)p.ell(x + seed * 37 % 20 - 10, y, r, r * 0.8, "#ffffff", 0);
    p.ell(300, 235, 230, 40, "#ffffff", 0);
};
export const fxShadow = (p, col)=>{
    const g = p.g;
    g.fillStyle = WHITE;
    g.fillRect(0, 0, 128, 256);
    g.save();
    g.filter = "blur(9px)";
    const lg = g.createLinearGradient(0, 205, 0, 22);
    lg.addColorStop(0, mix(col, WHITE, 0.08));
    lg.addColorStop(0.55, mix(col, WHITE, 0.3));
    lg.addColorStop(1, mix(col, WHITE, 0.85));
    g.fillStyle = lg;
    g.beginPath();
    g.moveTo(40, 205);
    g.bezierCurveTo(36, 120, 46, 50, 64, 30);
    g.bezierCurveTo(82, 50, 92, 120, 88, 205);
    g.closePath();
    g.fill();
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(64, 205, 30, 17, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
};
export const fxContact = (p, col)=>{
    const g = p.g;
    g.fillStyle = WHITE;
    g.fillRect(0, 0, 128, 128);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (const [r, k] of [
        [
            0,
            0
        ],
        [
            0.32,
            0.02
        ],
        [
            0.5,
            0.22
        ],
        [
            0.66,
            0.58
        ],
        [
            0.82,
            0.88
        ],
        [
            1,
            1
        ]
    ])gr.addColorStop(r, mix(col, WHITE, k));
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
};
export const fxPlank = (p)=>{
    p.poly(rrect(14, 30, 306, 78, 10), "#a8744a", 9);
    p.line([
        [
            40,
            46
        ],
        [
            150,
            44
        ],
        [
            270,
            50
        ]
    ], "#7d5234", 4);
    p.line([
        [
            60,
            62
        ],
        [
            200,
            64
        ],
        [
            284,
            60
        ]
    ], "#7d5234", 4);
    p.dot(36, 54, 5, INK);
    p.dot(284, 54, 5, INK);
};
export const fxDrum = (p)=>{
    p.poly(rrect(40, 70, 220, 190, 16), "#f1ece0", 9);
    p.poly(rrect(32, 58, 228, 86, 12), "#c9373a", 8);
    p.poly(rrect(32, 176, 228, 204, 12), "#c9373a", 8);
    p.line([
        [
            52,
            88
        ],
        [
            82,
            172
        ],
        [
            112,
            88
        ],
        [
            142,
            172
        ],
        [
            172,
            88
        ],
        [
            202,
            172
        ]
    ], INK, 6);
    p.ell(130, 58, 98, 18, "#f7f3ea", 8);
};
export const fxBlob = (p, col)=>{
    const g = p.g;
    g.fillStyle = WHITE;
    g.fillRect(0, 0, 128, 128);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (const [r, k] of [
        [
            0,
            0
        ],
        [
            0.5,
            0.04
        ],
        [
            0.64,
            0.18
        ],
        [
            0.76,
            0.42
        ],
        [
            0.87,
            0.72
        ],
        [
            0.95,
            0.92
        ],
        [
            1,
            1
        ]
    ])gr.addColorStop(r, mix(col, WHITE, k));
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
};
FACE.snore = { eye: ["dash", "dash"], brow: [0, -1], mouth: "o" };
FACE.stubborn = { eye: ["lid", "lid"], brow: [4, -3], mouth: "frown" };
FACE.squint = { eye: ["slit", "slit"], brow: [3, -2], mouth: "dash" };

// ---------------- Roman-era cast (our own designs), built on the Pen / blob / face helpers above ----------------
const STEEL = "#aeb6bf", BRASS = "#d9a845", LEATHER = "#7a4a2a";
export const OUTFITS = {
  legion: { tunic: "#b8322f", cape: "#8f2228", skin: SKIN, helmet: true, armor: true, spear: true, shield: true },
  old: { tunic: "#9c4a3c", cape: "#6e3330", skin: "#f3d6bb", helmet: "old", armor: true, spear: true, shield: false, beard: "#f4f1ea", brows: "#f4f1ea" },
  toga: { tunic: "#f1ead8", skin: "#f5c9a0", toga: "#6b3c8f", hair: "#3b2a20", stout: true },
  civA: { tunic: "#4f7fb8", skin: "#f5c9a0", hair: "#5a3b2a" },
  civB: { tunic: "#d9a441", skin: SKIN, hair: "#2b211c", dress: "#c25a7a" },
  civC: { tunic: "#5d8a3a", skin: "#c99067", hair: "#1e1714", stout: true },
  workA: { tunic: "#8a5d3b", skin: "#f5c9a0", cap: "#c2733a", apron: "#d8c9a6" },
  workB: { tunic: "#3f6a6f", skin: "#ecd0b6", cap: "#5b4a8a", moustache: "#4a3020" },
  // ---- Sengoku Japan, 1590 ----
  hideyoshi: { tunic: "#b5342b", skin: "#f6cfa6", do: ["#c23b2f", "#9a2a24", "#f0c24a"], kabuto: { col: "#24222b", rays: true }, moustache: "#2a1d1a", jinbaori: "#e9c25a" },
  ashiT: { tunic: "#4a4450", skin: "#f3c9a0", do: ["#3d3944", "#2e2b34", "#e0b44a"], jingasa: "#2b2730", mon: "#e9c25a", spear: true, sashi: "#e9c25a" },
  ashiT2: { tunic: "#5a3f35", skin: "#e8b88e", do: ["#3d3944", "#2e2b34", "#e0b44a"], jingasa: "#2b2730", mon: "#e9c25a", spear: true, sashi: "#e9c25a" },
  hojo: { tunic: "#2f3f70", skin: "#f7d2ae", kimono: true, hakama: "#5d6274", hair: "#1c1618", topknot: true, stout: true, crest: true, brows: "#1c1618" },
  hojoA: { tunic: "#6a4677", skin: "#f3c9a0", kimono: true, hakama: "#3e3a48", hair: "#231a1a", topknot: true, moustache: "#231a1a" },
  hojoB: { tunic: "#3e6d58", skin: "#efc59b", kimono: true, hakama: "#4a4136", hair: "#1e1714", topknot: true },
  guardH: { tunic: "#2f4a72", skin: "#f3c9a0", do: ["#35507a", "#283d5e", "#d8d0b8"], jingasa: "#22262e", mon: "#ffffff", spear: true, sashi: "#f2efe6", sashiMark: "uroko" },
  workJ: { tunic: "#8a6a48", skin: "#f0c296", hair: "#1e1714", hachimaki: "#f2efe6", short: true },
  workJ2: { tunic: "#4f6d8a", skin: "#e2b088", hair: "#2a1f1a", hachimaki: "#c8402f", short: true },
  workJ3: { tunic: "#7a8a50", skin: "#f3c9a0", hair: "#1e1714", hachimaki: "#f2efe6", short: true, stout: true },
  // ---- "What If You Were Born a Samurai?": YOU through the ages + supporting cast ----
  thor: { tunic: "#3d5a80", skin: "#f3c9a0", cape: "#a82c2c", hair: "#c0501c", beard: "#c0501c", brows: "#c0501c", stout: true },
  you0: { tunic: "#f4efe2", skin: "#f7d2ae", hair: "#1c1618", topknot: true },
  you5: { tunic: "#6a8fbf", skin: "#f7d2ae", kimono: true, hair: "#1c1618" },
  you7: { tunic: "#4a8f7a", skin: "#f7d2ae", kimono: true, hakama: "#4a4136", hair: "#1c1618" },
  you10: { tunic: "#2f4a72", skin: "#f5cfa8", kimono: true, hakama: "#3e3a48", hair: "#1c1618", crest: true },
  you13: { tunic: "#2f4a72", skin: "#f5cfa8", kimono: true, hakama: "#5d6274", hair: "#1c1618", topknot: true, crest: true },
  you15: { tunic: "#4a4450", skin: "#f3c9a0", do: ["#3d3944", "#2e2b34", "#e0b44a"], jingasa: "#2b2730", mon: "#2f4a72" },
  you25: { tunic: "#2f4a72", skin: "#f3c9a0", do: ["#35507a", "#283d5e", "#d8d0b8"], kabuto: { col: "#22262e" }, sashi: "#f2efe6", sashiMark: "uroko", spear: true, moustache: "#1c1618" },
  you45: { tunic: "#6a6f7a", skin: "#ecc59b", kimono: true, hakama: "#4a4a52", hair: "#8a8a92", topknot: true, moustache: "#8a8a92", brows: "#8a8a92" },
  father: { tunic: "#8a2a2a", skin: "#efc59b", do: ["#8a2f2f", "#5e2020", "#e0b44a"], kabuto: { col: "#2a2228", horns: true }, moustache: "#1c1618", spear: true, stout: true },
  mother: { tunic: "#e9dcc4", skin: "#f7d2ae", dress: "#a8426a", hair: "#1c1618", topknot: true },
  sensei: { tunic: "#6a5a3a", skin: "#f0c9a0", kimono: true, hakama: "#3a3a40", hair: "#d8d8d8", topknot: true, beard: "#d8d8d8", brows: "#d8d8d8" },
  lordB: { tunic: "#5a2f6a", skin: "#f7d2ae", kimono: true, hakama: "#3e3a48", hair: "#1c1618", topknot: true, stout: true, crest: true, brows: "#1c1618" },
  foe: { tunic: "#7a2a2a", skin: "#e8b88e", do: ["#8a3030", "#5e2020", "#e0b44a"], jingasa: "#2b1a1a", mon: "#e0b44a", spear: true, sashi: "#c23b2f" },
  // ---- Battle of Pelusium, 525 BC ----
  persKing: { tunic: "#7a2f9a", skin: "#e6b58a", cape: "#c9a24a", beard: "#1a1214", brows: "#1a1214", tiara: "#ece6d4", stout: true },
  persSold: { tunic: "#b5532f", skin: "#dda97c", cap: "#2f5f8f", beard: "#1a1214", shield: "bastet", spear: true },
  persSold2: { tunic: "#3f6a8f", skin: "#d49a6c", cap: "#a8452f", moustache: "#1a1214", shield: "bastet", spear: true },
  persPaint: { tunic: "#d9a441", skin: "#dda97c", cap: "#7a3a8a", moustache: "#1a1214" },
  egyArch: { tunic: "#c58a58", skin: "#c58a58", kilt: "#f4efe0", nemes: "#2f5fa0", collar: true, brows: "#14100e" },
  egyArch2: { tunic: "#cf9662", skin: "#cf9662", kilt: "#f4efe0", nemes: "#d9a845", collar: true, brows: "#14100e", stout: true },
  // ---- Qin Shi Huang ----
  qin: { tunic: "#1d1d26", skin: "#e8bd94", kimono: true, collarCol: "#e0b44a", sash: "#e0b44a", hakama: "#1d1d26", mian: "#15151d", beard: "#1a1214", brows: "#1a1214" },
  boyQin: { tunic: "#1d1d26", skin: "#f0c9a0", kimono: true, collarCol: "#e0b44a", sash: "#e0b44a", hakama: "#1d1d26", mian: "#15151d" },
  courtA: { tunic: "#b8282b", skin: "#e0b088", kimono: true, collarCol: "#f2efe6", sash: "#d9a441", hakama: "#7a1c1c", guan: "#15151d", moustache: "#1a1214" },
  courtB: { tunic: "#2f6f6a", skin: "#d9a67c", kimono: true, collarCol: "#f2efe6", sash: "#d9a441", hakama: "#1f4a46", guan: "#15151d", beard: "#3a3a3a" },
  qinSold: { tunic: "#3a3a44", skin: "#d9a67c", do: ["#6a5030", "#4a3822", "#c9a24a"], cap: "#1d1d26", spear: true, moustache: "#1a1214" },
  worker: { tunic: "#9a7a52", skin: "#d8a47a", hair: "#1a1214", hachimaki: "#cdbf90", short: true },
  worker2: { tunic: "#7a8a5a", skin: "#c99467", hair: "#1a1214", hachimaki: "#e8e0c8", short: true, stout: true },
  alchemist: { tunic: "#2f6f6a", skin: "#eac9a0", kimono: true, collarCol: "#e8dcc0", sash: "#8a5a34", hakama: "#2f6f6a", beard: "#d8d8d8", brows: "#d8d8d8", guan: "#15151d" },
  farmer: { tunic: "#4a6a8a", skin: "#c9926a", jingasa: "#d8c27a", mon: "#d8c27a", short: true },
  farmer2: { tunic: "#6a7a5a", skin: "#bf8a62", jingasa: "#cdb86a", mon: "#cdb86a", short: true, stout: true },
  scientist: { tunic: "#f4f4f6", skin: "#e8bd94", hair: "#2a2220", glasses: true, kimono: true, collarCol: "#c9d2dc", sash: "#c9d2dc", hakama: "#2f3a4a" },
  clayA: { tunic: "#b27a50", skin: "#c18a5e", do: ["#b98254", "#a6704a", "#8a5a38"], hair: "#4a3426", topknot: true, moustache: "#4a3426" },
  clayB: { tunic: "#b27a50", skin: "#c18a5e", do: ["#b98254", "#a6704a", "#8a5a38"], hair: "#4a3426", topknot: true, beard: "#4a3426" },
  clayC: { tunic: "#b27a50", skin: "#c18a5e", do: ["#b98254", "#a6704a", "#8a5a38"], cap: "#a6704a", moustache: "#4a3426" },
  clayD: { tunic: "#b27a50", skin: "#c18a5e", do: ["#b98254", "#a6704a", "#8a5a38"], hair: "#4a3426", beard: "#4a3426", brows: "#4a3426" },
  clayE: { tunic: "#b27a50", skin: "#c18a5e", do: ["#b98254", "#a6704a", "#8a5a38"], hair: "#4a3426", topknot: true, brows: "#4a3426" },
  clayF: { tunic: "#b27a50", skin: "#c18a5e", do: ["#b98254", "#a6704a", "#8a5a38"], cap: "#8a5a38", beard: "#4a3426" },
};

// ---------------- Sengoku headgear & props ----------------
const GOLD = "#f0c24a";
const uroko = (p, x, y, r, col = "#ffffff") => { // three-scale crest (stacked triangles)
  const t = (cx, cy) => [[cx - r, cy + r * 0.8], [cx, cy - r * 0.8], [cx + r, cy + r * 0.8]];
  p.poly(t(x, y - r * 0.8), col, r * 0.18); p.poly(t(x - r, y + r * 0.8), col, r * 0.18); p.poly(t(x + r, y + r * 0.8), col, r * 0.18);
};
const gourd = (p, x, y, r, col = GOLD) => { p.ell(x, y + r * 0.55, r * 0.75, r * 0.7, col, r * 0.16); p.ell(x, y - r * 0.45, r * 0.5, r * 0.48, col, r * 0.16); p.poly([[x - r * 0.12, y - r * 1.05], [x + r * 0.12, y - r * 1.05], [x + r * 0.1, y - r * 0.85], [x - r * 0.1, y - r * 0.85]], "#7a4a2a", r * 0.1); };
/** kabuto, behind the head: flared neck guard (shikoro) + optional gold rays */
const kabutoBack = (p, H, cx, hc, light, ow, K, u) => {
  if (K.rays) for (let i = 0; i < 23; i++) {
    const a = rad(196 + i * 6.8), r0 = 0.7 * H.a, r1 = (1.9 + 0.16 * (i % 2)) * H.a, oy = hc - 0.5 * H.b, w = 0.055;
    p.poly([[cx + Math.cos(a - w) * r0, oy + Math.sin(a - w) * r0], [cx + Math.cos(a) * r1, oy + Math.sin(a) * r1], [cx + Math.cos(a + w) * r0, oy + Math.sin(a + w) * r0]], GOLD, 2 * u);
  }
  for (let k = 2; k >= 0; k--) {
    const y0 = hc - 0.42 * H.b + k * 0.28 * H.b, y1 = y0 + 0.36 * H.b, w0 = (1.02 + k * 0.14) * H.a, w1 = (1.16 + k * 0.14) * H.a;
    const pts = [[cx - w0, y0], [cx + w0, y0], [cx + w1, y1], [cx - w1, y1]];
    p.gradFill(pts, K.col, mul(K.col, [0.6, 0.6, 0.7]), light); p.poly(pts, null, ow * 0.7);
    for (let i = -5; i <= 5; i++) p.dot(cx + i * w1 / 5.6, y1 - 5 * u, 1.8 * u, k % 2 ? "#c8402f" : GOLD);
  }
};
/** kabuto, over the head: ribbed bowl, gold brim band, turned-back wings (fukigaeshi), horns */
const kabutoFront = (p, H, cx, hc, light, ow, K, u) => {
  const bandY = hc - H.b * 0.4, bp = ellPts(cx, bandY, H.a * 1.08, H.b * 0.74, 180, 360, 0, 48);
  p.shadedFill(bp, K.col, mul(K.col, [0.62, 0.62, 0.72]), light, H.a, 0.4);
  p.clip(bp, () => { for (let i = -6; i <= 6; i++) p.stroke([[cx + i * 0.17 * H.a, bandY], [cx + i * 0.05 * H.a, bandY - 0.74 * H.b]], 1.3 * u, "#ffffff30");
    p.stroke(ellPts(cx - 22 * u, bandY - 0.36 * H.b, 0.22 * H.a, 0.16 * H.b, 200, 300, 0, 16), 4 * u, "#ffffff55"); });
  p.poly(bp, null, ow * 0.9);
  p.ell(cx, bandY - 0.74 * H.b, 7 * u, 3.5 * u, GOLD, 1.5 * u);
  p.band([[cx - H.a * 1.1, bandY], [cx + H.a * 1.1, bandY]], GOLD, 6.5 * u, 1.6 * u, "round");
  for (const s of [-1, 1]) {
    const w = [[cx + s * 0.98 * H.a, bandY - 0.08 * H.b], [cx + s * 1.5 * H.a, bandY - 0.42 * H.b], [cx + s * 1.58 * H.a, bandY + 0.1 * H.b], [cx + s * 1.08 * H.a, bandY + 0.28 * H.b]];
    p.gradFill(w, K.col, mul(K.col, [0.6, 0.6, 0.7]), light); p.poly(w, null, ow * 0.8);
    p.stroke([[w[1][0] - s * 3 * u, w[1][1] + 6 * u], [w[2][0] - s * 3 * u, w[2][1] - 4 * u]], 2.5 * u, GOLD);
    if (K.horns) p.stroke(curve([cx + s * 8 * u, bandY - 4 * u], [cx + s * 26 * u, bandY - 0.6 * H.b], [cx + s * 20 * u, bandY - 1.25 * H.b]), 4.5 * u, GOLD);
  }
};
/** jingasa: wide conical foot-soldier hat with a crest dot */
const jingasa = (p, H, cx, hc, light, ow, col, mon, u) => {
  const y = hc - 0.3 * H.b, pts = [[cx - 1.55 * H.a, y + 0.08 * H.b], [cx - 0.3 * H.a, hc - 1.12 * H.b], [cx + 0.3 * H.a, hc - 1.12 * H.b], [cx + 1.55 * H.a, y + 0.08 * H.b], [cx, y + 0.2 * H.b]];
  p.shadedFill(pts, col, mul(col, [0.6, 0.6, 0.7]), light, 1.4 * H.a, 0.3);
  p.clip(pts, () => { for (let i = -4; i <= 4; i++) p.stroke([[cx + i * 0.07 * H.a, hc - 1.1 * H.b], [cx + i * 0.38 * H.a, y + 0.16 * H.b]], 1.2 * u, "#ffffff22"); });
  p.poly(pts, null, ow * 0.9);
  p.ell(cx, hc - 0.68 * H.b, 9 * u, 8 * u, mon, 1.6 * u);
};
/** shaved pate + topknot (chonmage) */
const topknot = (p, H, cx, hc, light, skin, hair, u) => {
  p.shadedFill(ellPts(cx, hc - 0.72 * H.b, 0.5 * H.a, 0.26 * H.b, 180, 360, 0, 24).concat([[cx + 0.5 * H.a, hc - 0.7 * H.b], [cx - 0.5 * H.a, hc - 0.7 * H.b]]), mix(skin, "#9ab0c8", 0.25), skin, light, 0.5 * H.a, 0.3);
  p.poly(rrect(cx - 6 * u, hc - H.b - 18 * u, cx + 6 * u, hc - H.b + 8 * u, 5 * u), hair, 2.2 * u);
  p.stroke([[cx - 6 * u, hc - H.b + 2 * u], [cx + 6 * u, hc - H.b + 2 * u]], 1.6 * u, "#f2efe6");
};
/** hand props */
export const holdProp = (p, kind, hx, hy, u, cx, opts2 = 0) => {
  if (kind === "onigiri") { const r = 13 * u; p.poly([[hx - r, hy + r * 0.6], [hx, hy - r * 0.9], [hx + r, hy + r * 0.6]], "#fbfaf4", 2.2 * u); p.poly([[hx - r * 0.45, hy + r * 0.62], [hx + r * 0.45, hy + r * 0.62], [hx + r * 0.4, hy + r * 0.05], [hx - r * 0.4, hy + r * 0.05]], "#22302a", 1.4 * u); }
  if (kind === "fan") { const pts = [[hx, hy]]; for (let i = 0; i <= 10; i++) { const a = rad(-150 + i * 12); pts.push([hx + Math.cos(a) * 34 * u, hy + Math.sin(a) * 34 * u]); } p.poly(pts, GOLD, 2.2 * u); for (let i = 0; i <= 10; i += 2) { const a = rad(-150 + i * 12); p.stroke([[hx, hy], [hx + Math.cos(a) * 34 * u, hy + Math.sin(a) * 34 * u]], 1.2 * u, "#a8812e"); } p.ell(hx, hy - 14 * u, 7 * u, 7 * u, "#c8402f", 0); }
  if (kind === "flag") { const t = 10, fs = opts2 || 0; p.band([[hx, hy + 30 * u], [hx, t]], "#8a5a34", 4 * u, 1.4 * u, "round"); p.poly([[hx + 2 * u, t + 2], [hx + 96 * u, t + 6 * u + fs * 6 * u], [hx + 90 * u + fs * 4 * u, t + 52 * u - fs * 3 * u], [hx + 2 * u, t + 58 * u]], "#fbfaf4", 2.4 * u); }
  if (kind === "stone") { p.poly(rrect(hx - 4 * u, hy - 40 * u, hx + 74 * u, hy + 4 * u, 8 * u), "#a7a39a", 2.6 * u); p.stroke([[hx + 8 * u, hy - 30 * u], [hx + 40 * u, hy - 34 * u]], 2 * u, "#ffffff55"); }
  if (kind === "plank") { p.poly([[hx - 70 * u, hy - 12 * u], [hx + 90 * u, hy - 18 * u], [hx + 90 * u, hy - 4 * u], [hx - 70 * u, hy + 2 * u]], "#c49058", 2.2 * u); }
  if (kind === "bowL") { const pts = []; for (let i = 0; i <= 20; i++) { const a = rad(-62 + i * 6.2); pts.push([hx + 70 * u - Math.cos(a) * 74 * u, hy - 30 * u + Math.sin(a) * 170 * u]); } p.stroke(pts, 4.4 * u, "#8a5a34"); if (!opts2) p.stroke([pts[0], pts[pts.length - 1]], 1.2 * u, "#f2efe6"); }
  if (kind === "bokken") { p.band([[hx, hy + 6 * u], [hx + 5 * u, hy - 62 * u]], "#c49058", 4.4 * u, 1.4 * u, "round"); p.band([[hx, hy + 6 * u], [hx + 1 * u, hy - 4 * u]], "#5a3b2a", 5.2 * u, 1.2 * u, "round"); }
  if (kind === "shovel") { p.band([[hx + 4 * u, hy - 70 * u], [hx + 2 * u, hy + 26 * u]], "#8a5a34", 3.6 * u, 1.3 * u, "round"); p.poly([[hx - 8 * u, hy + 24 * u], [hx + 14 * u, hy + 24 * u], [hx + 12 * u, hy + 54 * u], [hx - 6 * u, hy + 54 * u]], "#9aa0a8", 2.2 * u); }
  if (kind === "brush") { p.band([[hx, hy], [hx + 8 * u, hy - 34 * u]], "#6a4a32", 2.8 * u, 1 * u, "round"); p.poly([[hx - 2 * u, hy + 2 * u], [hx + 3 * u, hy + 2 * u], [hx + 1 * u, hy + 14 * u]], "#1c1618", 1.2 * u); }
  if (kind === "bow") { const pts = []; for (let i = 0; i <= 20; i++) { const a = rad(-62 + i * 6.2); pts.push([hx - 70 * u + Math.cos(a) * 74 * u, hy - 30 * u + Math.sin(a) * 170 * u]); } p.stroke(pts, 4.4 * u, "#8a5a34"); p.stroke([pts[0], pts[pts.length - 1]], 1.2 * u, "#f2efe6"); }
  if (kind === "scroll") { p.poly(rrect(hx - 22 * u, hy - 12 * u, hx + 22 * u, hy + 12 * u, 6 * u), "#efe4c6", 2.2 * u); p.poly(rrect(hx - 26 * u, hy - 14 * u, hx - 18 * u, hy + 14 * u, 3 * u), "#7a5a3c", 1.6 * u); p.stroke([[hx - 12 * u, hy - 4 * u], [hx + 14 * u, hy - 4 * u]], 1.4 * u, "#2a1d1a"); p.stroke([[hx - 12 * u, hy + 4 * u], [hx + 8 * u, hy + 4 * u]], 1.4 * u, "#2a1d1a"); }
  if (kind === "abacus") { p.poly(rrect(hx - 34 * u, hy - 20 * u, hx + 34 * u, hy + 20 * u, 3 * u), "#8a5a34", 2.2 * u); for (let r = 0; r < 4; r++) { p.stroke([[hx - 30 * u, hy - 12 * u + r * 8 * u], [hx + 30 * u, hy - 12 * u + r * 8 * u]], 1 * u, "#3a2a20"); for (let b = 0; b < 4; b++) p.dot(hx - 22 * u + ((b * 13 + r * 7) % 40) * u, hy - 12 * u + r * 8 * u, 3 * u, "#e9d6a8"); } }
  if (kind === "hammer") { p.band([[hx, hy], [hx + 8 * u, hy - 46 * u]], "#8a5a34", 3.4 * u, 1.2 * u, "round"); p.poly(rrect(hx - 8 * u, hy - 60 * u, hx + 26 * u, hy - 42 * u, 3 * u), "#6a4a32", 2 * u); }
};

/** galea: iron bowl, brass brow band, cheek guards, transverse red crest */
const galea = (p, H, cx, hc, light, thick, ow, old, u) => {
  const crest = old ? "#8d4b3f" : "#d2372f", bowl = old ? "#8f8a7e" : STEEL;
  // crest (behind the bowl top)
  const cy0 = hc - H.b * 0.98;
  const cr = ellPts(cx, cy0, 0.66 * 2 * H.a, 0.42 * 2 * H.b, 180, 360, 0, 40);
  cr.push([cx + 0.66 * 2 * H.a * 0.98, cy0 + 4 * u], [cx - 0.66 * 2 * H.a * 0.98, cy0 + 4 * u]);
  const crP = [...ellPts(cx, cy0 + 2 * u, 0.62 * 2 * H.a, 0.36 * 2 * H.b, 180, 360, 0, 40)];
  p.shadedFill(crP, crest, mul(crest, [0.7, 0.62, 0.7]), light, 0.62 * 2 * H.a, 0.3);
  p.clip(crP, () => { for (let i = -9; i <= 9; i++) p.stroke([[cx + i * 7.4 * u, cy0], [cx + i * 9.4 * u, cy0 - 0.62 * H.b * Math.cos(i / 11)]], 1.4 * u, mul(crest, [0.62, 0.55, 0.62])); });
  if (old) p.clip(crP, () => { for (let i = 0; i < 6; i++) p.ell(cx + (i - 3) * 22 * u, cy0 - 18 * u - (i % 2) * 10 * u, 9 * u, 5 * u, "#6f6a5e", 0); });
  p.inkRing(crP, ow * 0.85, thick);
  p.poly(rrect(cx - 10 * u, cy0 - 6 * u, cx + 10 * u, cy0 + 6 * u, 3 * u), BRASS, 2 * u);
  // bowl: upper head cap
  const bandY = hc - H.b * 0.42;
  const bp = ellPts(cx, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
  p.shadedFill(bp, bowl, mul(bowl, [0.62, 0.64, 0.72]), light, H.a, 0.4);
  p.clip(bp, () => {
    p.stroke(ellPts(cx - 20 * u, bandY - 0.3 * H.b, 0.25 * H.a, 0.18 * H.b, 200, 300, 0, 16), 4 * u, "#ffffff55");
    if (old) for (let i = 0; i < 9; i++) p.ell(cx + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (3 + (i % 3) * 2) * u, (2 + (i % 2)) * u, "#8a4b22", 0);
  });
  p.inkRing(bp, ow * 0.9, thick);
  p.band([[cx - H.a * 1.04, bandY], [cx + H.a * 1.04, bandY]], old ? "#a88a4a" : BRASS, 7 * u, 1.8 * u, "round");
  for (const s of [-1, 1]) p.dot(cx + s * 0.55 * H.a, bandY, 2.2 * u, "#fff3c4");
};
const cheeks = (p, H, cx, hc, light, ow, old, u) => {
  const bowl = old ? "#8f8a7e" : STEEL;
  for (const s of [-1, 1]) {
    const x0 = cx + s * 0.78 * H.a, x1 = cx + s * 1.07 * H.a, y0 = hc - H.b * 0.42, y1 = hc + H.b * 0.48;
    const pts = [[x0, y0], [x1, y0], [x1 - s * 0.04 * H.a, y1 - 0.1 * H.b], [x0 + s * 0.06 * H.a, y1], [x0 - s * 0.05 * H.a, (y0 + y1) / 2]];
    p.shadedFill(pts, bowl, mul(bowl, [0.62, 0.64, 0.72]), light, 0.2 * H.a, 0.3);
    p.poly(pts, null, ow * 0.8);
    p.dot((x0 + x1) / 2, (y0 + y1) / 2 - 0.05 * H.b, 2.2 * u, BRASS);
  }
};
const cobweb = (p, cx, cy, r, u) => {
  const g = p.g; g.save(); g.globalAlpha = 0.8;
  for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.05 + 0.9 * i / 6); p.stroke([[cx, cy], [cx + Math.cos(a) * r, cy + Math.sin(a) * r]], 1.1 * u, "#f2f2f2"); }
  for (let k = 1; k <= 4; k++) { const rr = r * k / 4.3, pts = []; for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.05 + 0.9 * i / 6); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } p.stroke(pts, 1 * u, "#f2f2f2"); }
  g.restore();
};

/** front-facing Roman-era character. opts: expr, blink, look, facing, seed, L/R arm poses, tilt, headTilt, bob, nohelmet, light */
const mianTop = (p, H, cx, hc, light, ow, col, u) => { // imperial crown: flat board with hanging bead strings
  const y = hc - 1.0 * H.b, cap = ellPts(cx, hc - 0.5 * H.b, H.a * 1.0, H.b * 0.6, 180, 360, 0, 30);
  p.shadedFill(cap, col, mul(col, [0.7, 0.7, 0.8]), light, H.a, 0.4); p.poly(cap, null, ow * 0.8);
  const board = [[cx - 1.45 * H.a, y - 0.14 * H.b], [cx + 1.45 * H.a, y - 0.14 * H.b], [cx + 1.3 * H.a, y + 0.1 * H.b], [cx - 1.3 * H.a, y + 0.1 * H.b]];
  p.gradFill(board, col, mul(col, [0.6, 0.6, 0.7]), light); p.poly(board, null, ow * 0.9);
  p.band([[cx - 1.4 * H.a, y + 0.1 * H.b], [cx + 1.4 * H.a, y + 0.1 * H.b]], GOLD, 5 * u, 1.4 * u);
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const x = cx + s * (0.3 + i * 0.2) * H.a * 1.0; p.stroke([[x, y + 0.1 * H.b], [x, y + 0.62 * H.b]], 1.7 * u, "#efe6cc"); for (let k = 1; k <= 3; k++) p.dot(x, y + 0.1 * H.b + k * 0.17 * H.b, 2.6 * u, k % 2 ? "#2fa0a0" : GOLD); }
};
const guanTop = (p, H, cx, hc, light, ow, col, u) => { // tall official's cap
  const y0 = hc - 0.62 * H.b, y1 = hc - 1.75 * H.b, pts = [[cx - 0.92 * H.a, y0], [cx + 0.92 * H.a, y0], [cx + 0.78 * H.a, y1], [cx - 0.78 * H.a, y1]];
  p.shadedFill(pts, col, mul(col, [0.7, 0.7, 0.8]), light, H.a, 0.3); p.poly(pts, null, ow * 0.9); p.ell(cx, y1, 0.78 * H.a, 0.1 * H.b, mul(col, [1.3, 1.3, 1.3]), ow * 0.7);
  p.band([[cx - 0.95 * H.a, y0 - 2 * u], [cx + 0.95 * H.a, y0 - 2 * u]], GOLD, 6 * u, 1.4 * u);
};
const nemesBack = (p, H, cx, hc, light, ow, col, u) => {
  for (const s of [-1, 1]) {
    const pts = [[cx + s * 0.9 * H.a, hc - 0.35 * H.b], [cx + s * 1.5 * H.a, hc - 0.15 * H.b], [cx + s * 1.55 * H.a, hc + 1.7 * H.b], [cx + s * 0.95 * H.a, hc + 1.55 * H.b]];
    p.gradFill(pts, col, mul(col, [0.6, 0.6, 0.7]), light); p.poly(pts, null, ow * 0.8);
    for (let i = 1; i < 6; i++) { const y = hc - 0.2 * H.b + i * 0.3 * H.b; p.stroke([[cx + s * 0.95 * H.a, y], [cx + s * 1.5 * H.a, y + 0.1 * H.b]], 2.4 * u, GOLD); }
  }
};
const nemesTop = (p, H, cx, hc, light, ow, col, u) => {
  const pts = ellPts(cx, hc - 0.18 * H.b, H.a * 1.06, H.b * 0.9, 180, 360, 0, 40);
  pts.push([cx + H.a * 1.06, hc - 0.05 * H.b], [cx - H.a * 1.06, hc - 0.05 * H.b]);
  p.shadedFill(pts, col, mul(col, [0.62, 0.64, 0.72]), light, H.a, 0.4);
  p.clip(pts, () => { for (let i = -6; i <= 6; i++) p.stroke([[cx + i * 0.16 * H.a, hc - 0.9 * H.b], [cx + i * 0.2 * H.a, hc]], 3 * u, i % 2 ? GOLD : "#ffffff55"); });
  p.poly(pts, null, ow * 0.9);
  p.band([[cx - H.a * 1.04, hc - 0.28 * H.b], [cx + H.a * 1.04, hc - 0.28 * H.b]], GOLD, 7 * u, 1.6 * u, "round");
};
const tiaraTop = (p, H, cx, hc, light, ow, col, u) => { // tall Persian felt cap with a blue-white diadem
  const y0 = hc - 0.62 * H.b, y1 = hc - 2.45 * H.b, w0 = 1.04 * H.a, w1 = 1.16 * H.a, pts = [[cx - w0, y0], [cx + w0, y0], [cx + w1, y1], [cx - w1, y1]];
  p.shadedFill(pts, col, mul(col, [0.78, 0.76, 0.8]), light, H.a, 0.3); p.poly(pts, null, ow * 0.9);
  p.ell(cx, y1, w1, 0.12 * H.b, mul(col, [0.9, 0.9, 0.92]), ow * 0.8);
  p.band([[cx - w0 * 1.02, y0 - 3 * u], [cx + w0 * 1.02, y0 - 3 * u]], "#2f5fa0", 12 * u, 1.6 * u);
  p.band([[cx - w0 * 1.02, y0 - 3 * u], [cx + w0 * 1.02, y0 - 3 * u]], "#ffffff", 4 * u, 0);
  for (let i = -2; i <= 2; i++) p.dot(cx + i * 0.35 * H.a, y0 - 3 * u, 3 * u, GOLD);
};
/** animals (design canvas 600x1000, soles at y=975, drawn facing +x; flip the card to face left) */
export const critter = (p, kind, o = {}) => {
  const col = o.col || "#e0903c", dk = mix(col, INK, 0.5), lt = mix(col, "#ffffff", 0.55), st = o.step || 0, bl = o.blink || 0, wag = o.wag || 0;
  const eye = (x, y, r) => { if (bl > 0.5) p.stroke([[x - r, y], [x + r, y]], 6); else { p.ell(x, y, r, r * 1.15, "#d8f06a", 6); p.ell(x, y, r * 0.26, r * 1.0, INK, 0); } };
  const mouth = (x, y, open) => { if (open) { p.ell(x, y + 12, 22, 26, "#7a2a38", 5); p.ell(x, y + 22, 12, 9, "#e86e78", 0); } else { p.stroke(curve([x, y], [x - 14, y + 18], [x - 34, y + 8]), 4); p.stroke(curve([x, y], [x + 14, y + 18], [x + 34, y + 8]), 4); } };
  const sw = (ph, k = 26) => Math.sin((st + ph) * Math.PI * 2) * k;
  if (kind === "cat") {
    p.line(curve([440, 930], [560, 880 - wag * 24], [520, 700 - wag * 36]), col, 34);
    p.ell(300, 845, 122, 128, col, 12); p.ell(300, 880, 62, 82, lt, 0);
    p.ell(255, 962, 36, 20, col, 10); p.ell(345, 962, 36, 20, col, 10);
    p.poly([[196, 612], [214, 498], [292, 572]], col, 12); p.poly([[404, 612], [386, 498], [308, 572]], col, 12);
    p.poly([[220, 590], [228, 535], [262, 575]], "#e88a98", 0); p.poly([[380, 590], [372, 535], [338, 575]], "#e88a98", 0);
    p.ell(300, 660, 112, 98, col, 12);
    if (o.tabby) for (const dx of [-26, 0, 26]) p.stroke([[300 + dx, 585], [300 + dx * 1.1, 615]], 7, dk);
    eye(252, 650, 22); eye(348, 650, 22);
    p.poly([[288, 686], [312, 686], [300, 702]], "#e87a8a", 4); mouth(300, 702, o.expr === "meow");
    for (const s of [-1, 1]) for (const k of [0, 1, 2]) p.stroke([[300 + s * 62, 700 + k * 9], [300 + s * 150, 684 + k * 22]], 3);
    if (o.cap) { p.poly([[240, 575], [300, 470], [360, 575]], o.cap, 8); p.dot(300, 466, 9, "#e9c25a"); }
  } else if (kind === "catWalk") {
    p.line(curve([150, 830], [70, 780 + wag * 10], [100, 640 - wag * 20]), col, 30);
    for (const [x, ph] of [[205, 0], [255, 0.5], [365, 0.5], [415, 0]]) p.line([[x, 860], [x + sw(ph), 960]], dk, 26);
    p.ell(300, 830, 160, 74, col, 12); p.ell(300, 860, 110, 38, lt, 0);
    p.poly([[420, 722], [428, 650], [470, 705]], col, 10); p.poly([[470, 722], [492, 655], [510, 712]], col, 10);
    p.ell(470, 770, 74, 64, col, 12); eye(496, 758, 16);
    p.poly([[528, 780], [545, 780], [537, 792]], "#e87a8a", 3); p.stroke(curve([537, 792], [530, 806], [512, 800]), 3);
  } else if (kind === "dog") {
    p.line(curve([130, 790], [70, 740], [64 + wag * 30, 650]), dk, 26);
    for (const [x, ph] of [[190, 0], [250, 0.5], [350, 0.5], [410, 0]]) p.line([[x, 850], [x + sw(ph, 32), 962]], col, 30);
    p.ell(290, 805, 175, 88, col, 12); p.ell(290, 850, 120, 40, lt, 0);
    p.ell(470, 720, 76, 64, col, 12); p.ell(535, 748, 52, 34, lt, 10); p.ell(586, 742, 14, 11, INK, 0);
    p.poly([[425, 680], [395, 770], [450, 760], [462, 690]], dk, 10);
    p.ell(490, 704, 12, 14, "#ffffff", 4); p.dot(492, 706, 6);
    p.poly([[372, 760], [420, 770], [420, 800], [368, 790]], "#c23b2f", 6); p.ell(540, 775, 10, 16, "#e86e78", 3);
  } else if (kind === "sheep") {
    for (const [x, ph] of [[220, 0], [270, 0.5], [350, 0.5], [400, 0]]) p.line([[x, 880], [x + sw(ph, 22), 962]], "#3a3030", 14);
    for (const [x, y, r] of [[300, 790, 120], [200, 800, 80], [400, 800, 80], [250, 740, 80], [350, 740, 80], [300, 700, 70], [210, 860, 60], [390, 860, 60], [300, 860, 70]]) p.ell(x, y, r, r * 0.85, "#f4f1e6", 10);
    p.ell(300, 790, 105, 80, "#f4f1e6", 0);
    p.poly([[440, 745], [405, 715], [440, 785]], "#3a3030", 8); p.ell(470, 780, 52, 48, "#3a3030", 10);
    p.ell(486, 770, 9, 10, "#ffffff", 0); p.dot(488, 772, 4); p.ell(504, 800, 18, 12, "#5a4a4a", 0);
  }
};
/** shield on an easel being painted with Bastet; prog 0..1 reveals the paint (stand=false for a plain shield) */
export const bastetShield = (p, prog = 1, stand = true) => {
  if (stand) { p.line([[250, 975], [305, 690]], "#6a4a32", 18); p.line([[360, 975], [305, 690]], "#6a4a32", 18); }
  const sp = rrect(130, 320, 470, 780, 30);
  p.gradFill(sp, "#d9b878", "#8a6a3a", rad(-120));
  p.clip(sp, () => { for (let i = 0; i < 15; i++) p.stroke([[130, 340 + i * 32], [470, 340 + i * 32]], 3, "#a8884e"); });
  p.poly(sp, null, 12);
  if (prog > 0.04) p.poly(rrect(165, 355, 435, 745, 22), "#2f5fa0", 5);
  const fx = 300, fy = 560, r = 100, G = "#e9c25a", K = "#14100e";
  if (prog > 0.3) { p.poly([[fx - r * 0.95, fy - r * 0.3], [fx - r * 0.75, fy - r * 1.35], [fx - r * 0.15, fy - r * 0.8]], G, 6); p.poly([[fx + r * 0.95, fy - r * 0.3], [fx + r * 0.75, fy - r * 1.35], [fx + r * 0.15, fy - r * 0.8]], G, 6); }
  if (prog > 0.45) p.ell(fx, fy, r, r * 0.9, G, 7);
  if (prog > 0.6) { p.ell(fx - r * 0.38, fy - r * 0.1, r * 0.17, r * 0.2, K, 0); p.ell(fx + r * 0.38, fy - r * 0.1, r * 0.17, r * 0.2, K, 0); }
  if (prog > 0.72) { p.poly([[fx - r * 0.12, fy + r * 0.18], [fx + r * 0.12, fy + r * 0.18], [fx, fy + r * 0.34]], K, 0); p.stroke(curve([fx, fy + r * 0.34], [fx - 14, fy + r * 0.55], [fx - r * 0.3, fy + r * 0.45]), 5, K); p.stroke(curve([fx, fy + r * 0.34], [fx + 14, fy + r * 0.55], [fx + r * 0.3, fy + r * 0.45]), 5, K); }
  if (prog > 0.85) for (const sg of [-1, 1]) for (const k of [0, 1, 2]) p.stroke([[fx + sg * r * 0.6, fy + r * (0.28 + k * 0.1)], [fx + sg * r * 1.3, fy + r * (0.16 + k * 0.24)]], 4, K);
  if (prog > 0.9) p.poly(sp, null, 12);
};
/** hourglass card: sand = fraction still in the top bulb (0..1); a thin stream falls while 0 < sand < 1 */
export const hourglass = (p, sand = 0.5) => {
  const wood = "#7a4a2a", SAND = "#e8c060", glass = "rgba(207,232,240,0.5)";
  const xl = (y) => 270 - 80 * (500 - y) / 300, xr = (y) => 330 + 80 * (500 - y) / 300, bl = (y) => 270 - 80 * (y - 500) / 380, br = (y) => 330 + 80 * (y - 500) / 380;
  p.poly(rrect(170, 880, 430, 935, 14), wood, 10); p.poly(rrect(170, 145, 430, 200, 14), wood, 10);
  p.poly([[190, 200], [410, 200], [330, 500], [270, 500]], glass, 0); p.poly([[270, 500], [330, 500], [410, 880], [190, 880]], glass, 0);
  const yt = 500 - sand * 300, yb = 880 - (1 - sand) * 300 * 0.9;
  if (sand > 0.01) p.poly([[xl(yt), yt], [xr(yt), yt], [330, 500], [270, 500]], SAND, 0);
  if (sand < 0.99) p.poly([[190, 880], [410, 880], [br(yb), yb], [bl(yb), yb]], SAND, 0);
  if (sand > 0.01 && sand < 0.99) p.stroke([[300, 500], [300, yb]], 5, SAND);
  p.poly([[190, 200], [410, 200], [330, 500], [270, 500]], null, 10); p.poly([[270, 500], [330, 500], [410, 880], [190, 880]], null, 10);
  for (const x of [190, 410]) p.line([[x, 200], [x, 880]], wood, 14);
};
/** glowing elixir flask */
export const elixirVial = (p, glow = 1) => {
  const g = p.g, gr = g.createRadialGradient(300, 700, 20, 300, 700, 330 * glow + 40);
  gr.addColorStop(0, "rgba(160,255,190," + (0.85 * glow).toFixed(2) + ")"); gr.addColorStop(1, "rgba(160,255,190,0)"); g.fillStyle = gr; g.fillRect(0, 300, 600, 700);
  p.poly(rrect(262, 430, 338, 600, 10), "rgba(220,240,240,0.7)", 9); p.ell(300, 730, 150, 140, "rgba(220,240,240,0.7)", 10); p.ell(300, 755, 126, 112, "#7dffb0", 0);
  p.ell(300, 640, 30, 14, "#b9ffd2", 0); p.poly(rrect(270, 395, 330, 440, 8), "#8a5a34", 8);
  for (const [x, y, r] of [[250, 760, 14], [335, 790, 10], [300, 715, 8]]) p.ell(x, y, r, r, "#d8ffe4", 3);
};
/** dial gauge, v 0..1 sweeps the needle across the dial; the right part of the dial is red */
export const gauge = (p, v = 0) => {
  const cx = 300, cy = 600, R = 200;
  p.ell(cx, cy, R + 24, R + 24, "#3a4250", 12); p.ell(cx, cy, R, R, "#f4f1e6", 6);
  p.arc(cx, cy, R * 0.82, R * 0.82, 270 - 30, 270 + 30 + 30, 22, "#c8402f");
  for (let i = 0; i <= 10; i++) { const a = rad(210 + i * 12); p.stroke([[cx + Math.cos(a) * R * 0.78, cy + Math.sin(a) * R * 0.78], [cx + Math.cos(a) * R * 0.95, cy + Math.sin(a) * R * 0.95]], 5); }
  const a = rad(210 + clamp01(v) * 120); p.line([[cx, cy], [cx + Math.cos(a) * R * 0.85, cy + Math.sin(a) * R * 0.85]], "#c8402f", 9);
  p.dot(cx, cy, 18, "#2a2a30");
};
const clamp01 = (x) => Math.max(0, Math.min(1, x));
/** a clay head coming up out of the soil (emerge 0..1) */
export const clayHead = (p, emerge = 1) => {
  const hy = 960 - emerge * 250;
  p.line([[300, hy + 20], [300, 960]], "#b98254", 70);
  p.ell(300, hy - 30, 118, 132, "#c18a5e", 10); p.poly([[290, hy - 190], [310, hy - 190], [314, hy - 150], [286, hy - 150]], "#4a3426", 7); p.ell(300, hy - 175, 26, 30, "#4a3426", 8);
  p.stroke([[250, hy - 40], [282, hy - 36]], 6); p.stroke([[318, hy - 36], [350, hy - 40]], 6); p.stroke([[300, hy - 28], [296, hy + 4], [308, hy + 4]], 5); p.stroke([[276, hy + 36], [326, hy + 34]], 6);
  p.stroke([[262, hy - 70], [286, hy - 76]], 7, "#4a3426"); p.stroke([[316, hy - 76], [340, hy - 70]], 7, "#4a3426");
  p.poly([[110, 975], [190, 880], [300, 905], [420, 868], [500, 975]], "#8a6a44", 10);
  for (const [x, y] of [[170, 930], [260, 922], [380, 915], [450, 940]]) p.ell(x, y, 16, 9, "#6a4e30", 0);
};
/** crown on a cushion */
export const crownCard = (p) => {
  p.ell(300, 900, 190, 60, "#a8282b", 10); p.ell(300, 892, 140, 36, "#c83a3c", 0);
  p.poly([[160, 820], [440, 820], [410, 800], [190, 800]], "#15151d", 9); p.band([[160, 822], [440, 822]], "#e0b44a", 12, 2);
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const x = 300 + s * (50 + i * 34); p.stroke([[x, 824], [x, 880]], 3, "#efe6cc"); for (let k = 1; k <= 2; k++) p.dot(x, 824 + k * 20, 5, k % 2 ? "#2fa0a0" : "#e0b44a"); }
};
export const LAST = {};
export const romanFront = (p, key, opts = {}) => {
  const O = typeof key === "string" ? OUTFITS[key] : key;
  const { expr = "neutral", blink = 0, look = 0, facing = 0, seed = 3, L = "hang", R = O.spear ? "spear" : "hang", tilt = 0, headTilt = 0,
    bob = 0, nohelmet = false, light = rad(-120), web = false, step = 0, hold = null, hold2 = null } = opts;
  const lid = lidOf(blink), skin = O.skin ?? SKIN;
  const H = headBlob(seed, 118, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const torsoL = O.stout ? 1.12 : 1.08, legsL = 1.38, sole = 975;
  const torsoBot = sole - legsL * HH - bob * HH, chin = torsoBot - torsoL * HH, hc = chin - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u, cx = 300;
  const legCol = mix(O.tunic, INK, 0.62), armCol = mix(O.tunic, INK, 0.5);
  const helmet = !!O.helmet && !nohelmet, old = O.helmet === "old";
  p.rot = null;
  if (O.sashi) { // back banner on a pole (sashimono)
    const bx = cx + 0.34 * W, top = 14;
    p.band([[bx, chin + 0.3 * HH], [bx, top]], "#5a3b2a", 3.4 * u, 1.2 * u, "round");
    const fl = [[bx, top + 6 * u], [bx + 0.5 * W, top + 6 * u], [bx + 0.5 * W, top + 0.75 * HH], [bx, top + 0.75 * HH]];
    p.gradFill(fl, O.sashi, mul(O.sashi, [0.8, 0.8, 0.85]), light); p.poly(fl, null, 2.4 * u);
    if (O.sashiMark === "uroko") uroko(p, bx + 0.25 * W, top + 0.36 * HH, 7 * u, "#2f4a72"); else gourd(p, bx + 0.25 * W, top + 0.4 * HH, 12 * u, "#b5342b");
  }
  if (O.jinbaori) { const cp = [[cx - 0.5 * W, chin + 0.06 * HH], [cx + 0.5 * W, chin + 0.06 * HH], [cx + 0.6 * W, torsoBot + 0.25 * HH], [cx - 0.6 * W, torsoBot + 0.25 * HH]]; p.gradFill(cp, O.jinbaori, mul(O.jinbaori, [0.6, 0.55, 0.6]), light); p.inkRing(cp, ow * 0.8, thick); }
  // ---- cape behind everything ----
  if (O.cape) {
    const cp = [[cx - 0.48 * W, chin + 0.08 * HH], [cx + 0.48 * W, chin + 0.08 * HH], [cx + 0.62 * W, sole - 0.55 * HH], [cx + 0.2 * W, sole - 0.45 * HH], [cx - 0.2 * W, sole - 0.5 * HH], [cx - 0.62 * W, sole - 0.55 * HH]];
    p.gradFill(cp, O.cape, mul(O.cape, [0.6, 0.6, 0.7]), light); p.inkRing(cp, ow * 0.8, thick);
  }
  // ---- legs ----
  const dress = !!O.dress;
  for (const side of [-1, 1]) {
    const up = Math.max(0, Math.sin(Math.PI * 2 * (step + (side > 0 ? 0.5 : 0)))) * 30 * (step ? 1 : 0);
    const hx = cx + side * 16 * u, fx = cx + side * 22 * u, fy = sole - 4 * u - up;
    p.stroke(curve([hx, hipY], [(hx + fx) / 2 + side * 2 * u, (hipY + fy) / 2], [fx, fy]), 5.8 * u, legCol);
    const sandal = O.helmet ? LEATHER : "#5a3b2a";
    p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u + 3, INK);
    p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u, sandal);
    if (O.helmet) for (let k = 1; k <= 3; k++) p.stroke([[fx - 4 * u, fy - k * 0.07 * HH], [fx + 4 * u, fy - k * 0.07 * HH - 2 * u]], 2 * u, LEATHER);
  }
  // ---- upper body ----
  p.rot = tilt ? [rad(tilt), cx, hipY] : null;
  const T = { a: (0.4 * W) / 1.06 * (O.stout ? 1.12 : 1), b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: O.stout ? 0.17 : 0.12, asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = cx + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const S = (side) => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
  const arm = (side, pose) => {
    const s = S(side), X = (k) => tcx + side * (T.a * 1.1 + k * u);
    switch (pose) {
      case "spear": return { pts: [s, [X(6), s[1] + 0.42 * HH], [X(10), s[1] + 0.2 * HH]], front: false };
      case "point": return { pts: [s, [X(28), s[1] - 0.02 * HH], [X(62), s[1] - 0.1 * HH]], front: false, finger: true };
      case "up": return { pts: [s, [X(14), s[1] - 0.3 * HH], [X(22), s[1] - 0.75 * HH]], front: false };
      case "wave": return { pts: [s, [X(16), s[1] - 0.2 * HH], [X(30 + 10 * Math.sin(opts.wv || 0)), s[1] - 0.62 * HH]], front: false };
      case "hip": return { pts: [s, [X(22), s[1] + 0.3 * HH], [tcx + side * T.a * 0.95, torsoBot - 0.3 * HH]], front: false };
      case "belly": return { pts: [s, [X(8), s[1] + 0.45 * HH], [tcx + side * 0.25 * T.a, torsoBot - 0.35 * HH]], front: true };
      case "temple": return { pts: [s, [X(26), s[1] + 0.05 * HH], [cx + side * (H.a + 16 * u), hc - 0.1 * HH]], front: false, swirl: true };
      case "lift": return { pts: [s, [X(20), s[1] - 0.25 * HH], [X(4), s[1] - 0.82 * HH]], front: false };
      case "shield": return { pts: [s, [X(4), s[1] + 0.4 * HH], [tcx + side * 0.6 * T.a, torsoBot - 0.1 * HH]], front: true };
      case "cross": return { pts: [s, [X(2), s[1] + 0.38 * HH], [tcx - side * 0.45 * T.a, s[1] + 0.32 * HH]], front: true };
      case "reach": { const lf = (opts.lift || 0) * 0.62 * HH; return { pts: [s, [X(42), s[1] - 0.12 * HH - lf * 0.6], [X(82), s[1] - 0.5 * HH - lf]], front: false }; }
      case "cheek": return { pts: [s, [X(16), s[1] + 0.05 * HH], [cx + side * (H.a + 2 * u), hc + 0.25 * H.b]], front: false };
      case "shh": return { pts: [s, [X(12), s[1] + 0.2 * HH], [cx + 8 * u * facing + side * 4 * u, hc + 0.52 * H.b]], front: true, late: true, shh: true };
      case "eat": return { pts: [s, [X(14), s[1] + 0.22 * HH], [cx + 8 * u * facing + side * 10 * u, hc + 0.62 * H.b]], front: true, late: true };
      case "carry": return { pts: [s, [X(14), s[1] - 0.22 * HH], [tcx + side * 0.6 * T.a, hc - 1.15 * H.b]], front: false };
      case "thumb": return { pts: [s, [X(20), s[1] + 0.12 * HH], [X(44), s[1] - 0.12 * HH]], front: false, thumb: true };
      default: return { pts: [s, [X(4), s[1] + 0.48 * HH], [X(3), chin + 1.04 * HH]], front: false };
    }
  };
  const arms = [arm(-1, L), arm(1, R)];
  const drawArm = (a) => {
    p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, armCol);
    const [hx, hy] = a.pts[2];
    p.dot(hx, hy, 5.5 * u);
    if (a.finger) { const dx = a.pts[2][0] - a.pts[1][0], dy = a.pts[2][1] - a.pts[1][1], l = Math.hypot(dx, dy); p.stroke([[hx, hy], [hx + dx / l * 14 * u, hy + dy / l * 14 * u]], 2.6 * u); }
    if (a.thumb) p.stroke([[hx, hy], [hx + Math.sign(hx - cx) * 6 * u, hy - 12 * u]], 2.6 * u);
  };
  // spear behind
  if (O.spear && R === "spear") {
    const [hx, hy] = arms[1].pts[2], s0 = [hx + 2 * u, sole - 2 * u], s1 = [hx - 3 * u, 70];
    p.band([s0, s1], old ? "#6d5236" : "#8a5a34", 4.2 * u, 1.4 * u, "round");
    const tip = [[s1[0] - 7 * u, s1[1] + 6 * u], [s1[0], s1[1] - 34 * u], [s1[0] + 7 * u, s1[1] + 6 * u], [s1[0], s1[1] + 14 * u]];
    p.poly(tip, old ? "#8b7c6a" : "#c9cfd6", 2 * u);
    if (web) cobweb(p, s1[0] - 2 * u, s1[1] + 60 * u, 70 * u, u);
  }
  for (const a of arms) if (!a.front && !a.late) drawArm(a);
  // torso
  if (dress) {
    const D = { a: 0.5 * W * 0.98, b: 0.5 * ((sole - 0.35 * HH) - (chin - 0.2 * HH)), nTop: 2.0, nBot: 3.0, egg: 0.35, asym: 0, rot: 0, noise: 0.006, seed: seed + 9 };
    const dp = blobPts(cx, sole - 0.35 * HH - D.b, D);
    p.gradFill(dp, O.dress, mul(O.dress, SH_CLOTH), light); p.inkRing(dp, ow, thick);
  }
  // skirt / pteruges below the torso
  if (O.hakama) {
    const hk = [[tcx - 0.95 * T.a, torsoBot - 0.2 * HH], [tcx + 0.95 * T.a, torsoBot - 0.2 * HH], [tcx + 1.3 * T.a, sole - 0.12 * HH], [tcx + 0.08 * T.a, sole - 0.1 * HH], [tcx - 0.08 * T.a, sole - 0.1 * HH], [tcx - 1.3 * T.a, sole - 0.12 * HH]];
    p.gradFill(hk, O.hakama, mul(O.hakama, SH_CLOTH), light); p.poly(hk, null, ow * 0.8);
    for (let i = -2; i <= 2; i++) p.stroke([[tcx + i * 0.3 * T.a, torsoBot - 0.1 * HH], [tcx + i * 0.42 * T.a, sole - 0.16 * HH]], 1.4 * u, mul(O.hakama, [0.7, 0.7, 0.75]));
  } else if (!dress) {
    const sk = [[tcx - 0.92 * T.a, torsoBot - 0.2 * HH], [tcx + 0.92 * T.a, torsoBot - 0.2 * HH], [tcx + 1.0 * T.a, torsoBot + 0.3 * HH], [tcx - 1.0 * T.a, torsoBot + 0.3 * HH]];
    const skc = O.kilt || O.tunic; p.gradFill(sk, skc, mul(skc, SH_CLOTH), light); p.poly(sk, null, ow * 0.8);
    if (O.armor) for (let i = -3; i <= 3; i++) { const x = tcx + i * 0.27 * T.a, st = [[x - 9 * u, torsoBot - 0.05 * HH], [x + 9 * u, torsoBot - 0.05 * HH], [x + 9 * u, torsoBot + 0.22 * HH], [x - 9 * u, torsoBot + 0.22 * HH]]; p.poly(st, old ? "#5e4632" : LEATHER, 1.6 * u); }
  }
  p.gradFill(tp, O.tunic, mul(O.tunic, SH_CLOTH), light);
  p.clip(tp, () => {
    if (O.armor) {
      const top = chin - 0.1 * HH, bot = torsoBot - 0.25 * HH, n = 5;
      for (let i = 0; i < n; i++) {
        const y0 = top + (bot - top) * i / n, y1 = top + (bot - top) * (i + 1) / n;
        const c = O.do ? O.do[i % 2] : old ? (i % 2 ? "#8d8679" : "#9a9384") : (i % 2 ? "#a7b0ba" : "#bcc4cc");
        p.poly([[tcx - 1.5 * T.a, y0], [tcx + 1.5 * T.a, y0 + 3 * u], [tcx + 1.5 * T.a, y1 + 3 * u], [tcx - 1.5 * T.a, y1]], c, 1.8 * u);
        if (O.do) for (let k = -4; k <= 4; k++) p.stroke([[tcx + k * 0.28 * T.a, y0 + 4 * u], [tcx + k * 0.28 * T.a, y1 - 2 * u]], 1.6 * u, O.do[2]);
      }
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.2 * HH], [tcx + 1.4 * T.a, torsoBot - 0.2 * HH]], O.do ? "#2a2028" : LEATHER, 0.08 * HH, 1.5 * u);
      if (O.do && O.mon && !O.kabuto) p.ell(tcx, chin + 0.3 * HH, 8 * u, 8 * u, O.mon, 1.6 * u);
      else if (!O.do) for (let i = -2; i <= 2; i++) p.dot(tcx + i * 0.3 * T.a, torsoBot - 0.2 * HH, 2.4 * u, BRASS);
      if (old) for (let i = 0; i < 5; i++) p.ell(tcx + Math.sin(i * 1.7) * 0.7 * T.a, top + (bot - top) * ((i * 0.31) % 1), 6 * u, 3 * u, "#8a4b22", 0);
    } else if (O.kimono || O.short) {
      const iy = O.short ? torsoBot - 0.15 * HH : torsoBot - 0.28 * HH;
      p.stroke([[tcx - 0.42 * T.a, chin - 0.02 * HH], [tcx + 0.12 * T.a, iy - 0.02 * HH]], 6 * u, O.collarCol || "#f2efe6");
      p.stroke([[tcx + 0.42 * T.a, chin - 0.02 * HH], [tcx - 0.05 * T.a, chin + 0.35 * HH]], 6 * u, O.collarCol || "#f2efe6");
      p.band([[tcx - 1.4 * T.a, iy], [tcx + 1.4 * T.a, iy]], O.sash || (O.short ? "#3a2c24" : "#d9b45a"), 0.07 * HH, 1.4 * u);
      if (O.crest) for (const s of [-1, 1]) uroko(p, tcx + s * 0.55 * T.a, chin + 0.28 * HH, 5 * u, "#f2efe6");
    } else {
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.24 * HH], [tcx + 1.4 * T.a, torsoBot - 0.24 * HH]], O.apron ? "#5a3b2a" : "#e2c27a", 0.05 * HH, 1.2 * u);
      if (O.toga) p.band([[tcx - 1.0 * T.a, chin - 0.1 * HH], [tcx + 1.1 * T.a, torsoBot - 0.1 * HH]], O.toga, 0.16 * HH, 1.6 * u);
      if (O.apron) p.poly([[tcx - 0.55 * T.a, torsoBot - 0.2 * HH], [tcx + 0.55 * T.a, torsoBot - 0.2 * HH], [tcx + 0.6 * T.a, torsoBot + 0.2 * HH], [tcx - 0.6 * T.a, torsoBot + 0.2 * HH]], O.apron, 1.6 * u);
      p.stroke([[tcx - 0.2 * T.a, chin + 0.02 * HH], [tcx, chin + 0.16 * HH], [tcx + 0.2 * T.a, chin + 0.02 * HH]], 2 * u);
    }
  });
  p.inkRing(tp, ow, thick);
  if (O.collar) { const cl = [[tcx - 0.72 * T.a, chin + 0.04 * HH], [tcx + 0.72 * T.a, chin + 0.04 * HH], [tcx + 0.46 * T.a, chin + 0.46 * HH], [tcx - 0.46 * T.a, chin + 0.46 * HH]]; p.poly(cl, "#e0b44a", 2 * u); p.band([[tcx - 0.6 * T.a, chin + 0.2 * HH], [tcx + 0.6 * T.a, chin + 0.2 * HH]], "#2fa0a0", 0.07 * HH, 1.4 * u); }
  if (O.do) for (const s of [-1, 1]) { // sode: hanging shoulder guards
    for (let k = 0; k < 3; k++) { const x0 = tcx + s * 0.62 * T.a, x1 = tcx + s * 1.28 * T.a, y0 = chin + (0.0 + k * 0.13) * HH, y1 = y0 + 0.14 * HH;
      p.poly([[x0, y0], [x1, y0 + 2 * u], [x1, y1 + 2 * u], [x0, y1]], O.do[k % 2], 1.8 * u); p.stroke([[x0 + s * 6 * u, y1 - 3 * u], [x1 - s * 4 * u, y1 - 1 * u]], 1.4 * u, O.do[2]); }
  } else if (O.armor) for (const s of [-1, 1]) { // shoulder plates
    const sp = ellPts(tcx + s * 0.72 * T.a, chin + 0.1 * HH, 0.42 * T.a, 0.13 * HH, 180, 360, s * 8, 20);
    p.poly(sp, old ? "#9a9384" : "#c5ccd3", 1.8 * u);
  }
  if (O.moss) {/* reserved */}
  for (const a of arms) if (a.front && !a.late) drawArm(a);
  // shield in front, held by the left hand
  if (O.shield && L === "shield") {
    const sx = tcx - 0.55 * T.a, sy = torsoBot + 0.05 * HH, sw = 0.36 * W, sh = 0.78 * HH;
    const sp = rrect(sx - sw, sy - sh, sx + sw, sy + sh, 8 * u);
    const bastet = O.shield === "bastet";
    p.gradFill(sp, bastet ? "#d9b878" : "#c0302c", bastet ? "#8a6a3a" : "#7d1d22", light);
    p.clip(sp, () => { if (bastet) return;
      p.band([[sx - sw, sy], [sx + sw, sy]], BRASS, 6 * u, 1.2 * u);
      p.band([[sx, sy - sh], [sx, sy + sh]], BRASS, 6 * u, 1.2 * u);
      for (const s of [-1, 1]) { p.stroke([[sx + s * 12 * u, sy - 14 * u], [sx + s * 34 * u, sy - 46 * u], [sx + s * 22 * u, sy - 44 * u], [sx + s * 46 * u, sy - 74 * u]], 3.5 * u, BRASS); p.stroke([[sx + s * 12 * u, sy + 14 * u], [sx + s * 34 * u, sy + 46 * u], [sx + s * 22 * u, sy + 44 * u], [sx + s * 46 * u, sy + 74 * u]], 3.5 * u, BRASS); }
      p.stroke(ellPts(sx - sw * 0.5, sy - sh * 0.7, sw * 0.3, sh * 0.1, 200, 320, 0, 10), 3 * u, "#ffffff44");
    });
    if (!bastet) p.ell(sx, sy, 13 * u, 13 * u, "#e6c068", 2.2 * u);
    p.inkRing(sp, ow, thick);
    if (bastet) { p.poly(rrect(sx - sw * 0.76, sy - sh * 0.8, sx + sw * 0.76, sy + sh * 0.8, 6 * u), "#2f5fa0", 2 * u); const fx = sx, fy = sy - 6 * u, r = Math.min(sw * 0.5, 34 * u);
      p.poly([[fx - r * 0.95, fy - r * 0.3], [fx - r * 0.75, fy - r * 1.35], [fx - r * 0.15, fy - r * 0.8]], "#e9c25a", 2 * u); p.poly([[fx + r * 0.95, fy - r * 0.3], [fx + r * 0.75, fy - r * 1.35], [fx + r * 0.15, fy - r * 0.8]], "#e9c25a", 2 * u);
      p.ell(fx, fy, r, r * 0.9, "#e9c25a", 2.4 * u); p.ell(fx - r * 0.38, fy - r * 0.1, r * 0.17, r * 0.2, "#14100e", 0); p.ell(fx + r * 0.38, fy - r * 0.1, r * 0.17, r * 0.2, "#14100e", 0);
      p.poly([[fx - r * 0.12, fy + r * 0.18], [fx + r * 0.12, fy + r * 0.18], [fx, fy + r * 0.32]], "#14100e", 0); }
  }
  // ---- head ----
  const [cpx, cpy] = rotAbout([cx, chin], rad(tilt), [cx, hipY]);
  const Ah = tilt + headTilt;
  p.rot = Ah ? [rad(Ah), cx, chin, cpx - cx, cpy - chin] : null;
  if (helmet) galea(p, H, cx, hc, light, thick, ow, old, u);
  if (O.kabuto) kabutoBack(p, H, cx, hc, light, ow, O.kabuto, u);
  if (O.nemes) nemesBack(p, H, cx, hc, light, ow, O.nemes, u);
  const hp = blobPts(cx, hc, H);
  if (O.hair && !helmet) { const hb = blobPts(cx, hc - 0.03 * HH, { ...H, a: H.a * 1.04, b: H.b * 1.05 }); p.poly(hb, O.hair, 0); }
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  if (helmet) {
    const bandY = hc - H.b * 0.42, bp = ellPts(cx, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
    p.shadedFill(bp, old ? "#8f8a7e" : STEEL, mul(old ? "#8f8a7e" : STEEL, [0.62, 0.64, 0.72]), light, H.a, 0.4);
    p.clip(bp, () => { p.stroke(ellPts(cx - 20 * u, bandY - 0.3 * H.b, 0.25 * H.a, 0.18 * H.b, 200, 300, 0, 16), 5 * u, "#ffffff66");
      if (old) for (let i = 0; i < 9; i++) p.ell(cx + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (4 + (i % 3) * 2) * u, (2.5 + (i % 2)) * u, "#8a4b22", 0); });
    p.poly(bp, null, ow * 0.9);
    p.band([[cx - H.a * 1.05, bandY], [cx + H.a * 1.05, bandY]], old ? "#a88a4a" : BRASS, 7 * u, 1.8 * u, "round");
    p.poly(rrect(cx - 4 * u, bandY - 0.55 * H.b, cx + 4 * u, bandY - 3 * u, 2 * u), old ? "#a88a4a" : BRASS, 1.5 * u);
    cheeks(p, H, cx, hc, light, ow, old, u);
  } else if (O.kabuto) kabutoFront(p, H, cx, hc, light, ow, O.kabuto, u);
  else if (O.jingasa) jingasa(p, H, cx, hc, light, ow, O.jingasa, O.mon || GOLD, u);
  else if (O.nemes) nemesTop(p, H, cx, hc, light, ow, O.nemes, u);
  else if (O.mian) mianTop(p, H, cx, hc, light, ow, O.mian, u);
  else if (O.guan) guanTop(p, H, cx, hc, light, ow, O.guan, u);
  else if (O.tiara) tiaraTop(p, H, cx, hc, light, ow, O.tiara, u);
  else if (O.cap) hatOn(p, { hat: "cap", cap: O.cap, jacket: O.tunic }, hp, H, cx, hc, light, seed, facing, false);
  else if (O.hair) hatOn(p, { hat: "hair", hair: O.hair, jacket: O.tunic }, hp, H, cx, hc, light, seed, facing, false);
  if (O.topknot) topknot(p, H, cx, hc, light, skin, O.hair, u);
  if (O.hachimaki) { const by = hc - (O.hmY ?? 0.5) * H.b; p.band([[cx - H.a * 1.03, by + 3 * u], [cx + H.a * 1.03, by - 1 * u]], O.hachimaki, 8 * u, 1.6 * u, "round"); p.stroke([[cx + H.a * 1.0, by], [cx + H.a * 1.3, by + 14 * u]], 4 * u, O.hachimaki); }
  else if (O.helmet && nohelmet) { // bald old head with white side tufts
    for (const s of [-1, 1]) p.ell(cx + s * 0.9 * H.a, hc - 0.1 * H.b, 0.22 * H.a, 0.3 * H.b, "#f4f1ea", 3 * u);
  }
  if (O.beard) {
    const bd = blobPts(cx + 6 * u * facing, hc + 0.85 * H.b, { a: 0.62 * H.a, b: 0.75 * H.b, nTop: 2.4, nBot: 1.6, egg: -0.35, asym: 0, rot: 0, noise: 0.02, seed: seed + 4 });
    p.shadedFill(bd, O.beard, mul(O.beard, [0.86, 0.86, 0.92]), light, 0.6 * H.a, 0.3);
    p.clip(bd, () => { for (let i = -3; i <= 3; i++) p.stroke([[cx + i * 9 * u, hc + 0.45 * H.b], [cx + i * 7 * u, hc + 1.35 * H.b]], 1.2 * u, "#c9c4bb"); });
    p.inkRing(bd, ow * 0.8, thick);
  }
  faceFront(p, cx, hc, W, expr, facing, look, lid, helmet || !!O.kabuto || !!O.jingasa, skin, O.beard ? O.beard : O.moustache, !!O.stout);
  if (O.glasses) { for (const s of [-1, 1]) p.ell(cx + 7 * u * facing + s * 15 * u, hc, 13 * u, 13 * u, null, 2.4 * u); p.stroke([[cx + 7 * u * facing - 3 * u, hc], [cx + 7 * u * facing + 3 * u, hc]], 2 * u); }
  if (O.brows) for (const s of [-1, 1]) p.ell(cx + 7 * u * facing + s * 14 * u, hc - 20 * u, 11 * u, 5 * u, O.brows, 2 * u);
  if (O.beard) { // re-draw the mouth over the beard for open mouths
    if (expr === "shock" || expr === "snore") p.ell(cx + 8 * u * facing, hc + 22 * u, 6 * u, 7 * u, "#5a1e28", 2 * u);
  }
  if (opts.soot) { // burnt: darkened head + frizzy hair spikes + redrawn face
    p.clip(hp, () => { p.g.fillStyle = "rgba(22,17,19," + opts.soot + ")"; p.g.fillRect(0, 0, 600, 1000); });
    faceFront(p, cx, hc, W, expr, facing, look, lid, helmet || !!O.kabuto || !!O.jingasa, skin, O.beard ? O.beard : O.moustache, !!O.stout);
    const hair = O.hair || "#333";
    for (let i = -6; i <= 6; i++) { const bx = cx + i * 0.17 * H.a, by = hc - H.b * (0.9 - 0.12 * Math.abs(i) / 6), len = (0.55 + 0.35 * ((i * 7) % 3 === 0 ? 1 : 0.5)) * H.b, ang = i * 0.12 + (opts.frizz || 0);
      p.poly([[bx - 8 * u, by + 6 * u], [bx + Math.sin(ang) * len * 0.55, by - Math.cos(ang) * len], [bx + 8 * u, by + 6 * u]], hair, 2.2 * u); }
  }
  p.rot = null;
  LAST.R = arms[1].pts[2]; LAST.L = arms[0].pts[2]; LAST.hc = hc; LAST.u = u; LAST.HH = HH; LAST.cx = cx;
  for (const a of arms) if (a.late) { drawArm(a); if (a.shh) { const [hx, hy] = a.pts[2]; p.stroke([[hx, hy], [hx, hy - 18 * u]], 3.2 * u); } }
  const hpL = arms[0].pts[2], hpR = arms[1].pts[2];
  if (hold) holdProp(p, hold, hpR[0], hpR[1], u, cx);
  if (hold2) holdProp(p, hold2, hpL[0], hpL[1], u, cx, opts.wave || 0);
  if (opts.draw) { const [bx, by] = hpL, [rx2, ry2] = hpR, ty = 150 * u; p.stroke([[bx + 35 * u, by - 30 * u - ty], [rx2, ry2], [bx + 35 * u, by - 30 * u + ty]], 1.8 * u, "#f2efe6"); p.stroke([[bx - 6 * u, by - 2 * u], [rx2, ry2]], 2.6 * u, "#8a5a34"); p.poly([[bx - 20 * u, by - 8 * u], [bx - 4 * u, by - 2 * u], [bx - 20 * u, by + 4 * u]], "#aab0b8", 1.4 * u); }
  if (L === "carry" && R === "carry" && opts.load) holdProp(p, opts.load, cx - 36 * u, Math.min(hpL[1], hpR[1]) + 2 * u, u, cx);
  if (arms.some((a) => a.swirl)) { // cuckoo swirl next to the temple
    const a = arms.find((x) => x.swirl), [hx, hy] = a.pts[2], ph = opts.swirl || 0, pts = [];
    for (let i = 0; i < 40; i++) { const t = i / 40 * Math.PI * 4 + ph, r = (4 + i * 0.7) * u; pts.push([hx + Math.cos(t) * r, hy - 40 * u + Math.sin(t) * r]); }
    p.stroke(pts, 3 * u, "#ffffff"); p.stroke(pts, 1.4 * u, INK);
  }
};

/** loose helmet prop card (lifted off the old soldier) */
export const helmetCard = (p) => {
  const H = headBlob(3, 118, 0), u = 2 * H.a / 100, hc = 560, light = rad(-120), thick = thickAngle(light), ow = 5 * u;
  galea(p, H, 300, hc, light, thick, ow, true, u);
  const bandY = hc - H.b * 0.42, bp = ellPts(300, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
  // dark inside visible from below
  p.ell(300, bandY, H.a * 1.05, 0.12 * H.b, "#2a221e", 0);
  p.shadedFill(bp, "#8f8a7e", mul("#8f8a7e", [0.62, 0.64, 0.72]), light, H.a, 0.4);
  p.clip(bp, () => { for (let i = 0; i < 9; i++) p.ell(300 + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (4 + (i % 3) * 2) * u, (2.5 + (i % 2)) * u, "#8a4b22", 0); });
  p.poly(bp, null, ow * 0.9);
  p.band([[300 - H.a * 1.05, bandY], [300 + H.a * 1.05, bandY]], "#a88a4a", 7 * u, 1.8 * u, "round");
  cheeks(p, H, 300, hc, light, ow, true, u);
};

/** ZZZ for the sleeping guard */
export const fxZ = (p, t) => {
  const g = p.g; g.save(); g.font = "900 120px Arial Black, Arial"; g.lineJoin = "round";
  for (let i = 0; i < 3; i++) {
    const k = (t + i / 3) % 1, x = 220 + i * 70 + Math.sin(k * 6) * 20, y = 700 - k * 500, s = 0.5 + k * 0.7;
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = Math.min(1, (1 - k) * 2.5);
    g.lineWidth = 16; g.strokeStyle = INK; g.strokeText("Z", 0, 0); g.fillStyle = "#ffffff"; g.fillText("Z", 0, 0); g.restore();
  }
  g.restore();
};
/** falling leaf */
export const fxLeaf = (p, col) => { p.poly([[300, 380], [420, 470], [300, 620], [180, 470]], col, 14); p.stroke([[300, 400], [300, 600]], 8); };
/** dust cloud puff (k 0..1 growth) */
export const fxDust = (p, k, col = "#e8dcc4") => {
  const g = p.g; g.save(); g.globalAlpha = Math.max(0, 1 - k * k);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, r = 90 + 150 * k; p.ell(300 + Math.cos(a) * r, 520 + Math.sin(a) * r * 0.6, 120 + 60 * k, 100 + 50 * k, col, 12); }
  p.ell(300, 520, 170 + 110 * k, 140 + 80 * k, col, 0);
  g.restore();
};
export const fxDrip = (p) => p.ell(300, 500, 40, 64, "#9fd4ff", 10);
export const fxWood = (p, seed) => { p.poly([[200, 420], [400, 400], [420, 560], [230, 600]], "#5b3d22", 14); p.stroke([[240, 450], [380, 440]], 6, "#3a2614"); p.ell(330, 520, 26, 18, "#4d7a32", 0); };

export const headCenter = (seed = 3) => { const H = headBlob(seed, 118, 0), HH = 2 * H.b; return 975 - 1.38 * HH - 1.08 * HH - H.b; };
