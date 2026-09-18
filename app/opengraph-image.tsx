import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt =
  "Lenshift — Same world. Different reality. Interactive vision simulator.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const ringColors = ["#dff2b8", "#bcd4c3", "#e8eccf"];

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #0d1913 0%, #1c2c22 52%, #344638 100%)",
        color: "#f4f5ed",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "radial-gradient(circle at 78% 47%, rgba(215, 239, 173, 0.17) 0%, rgba(215, 239, 173, 0.06) 25%, rgba(13, 25, 19, 0) 53%)",
        }}
      />

      {ringColors.map((color, index) => {
        const ringSize = 414 + index * 98;
        return (
          <div
            key={color}
            style={{
              position: "absolute",
              left: 930 - ringSize / 2,
              top: 310 - ringSize / 2,
              display: "flex",
              width: ringSize,
              height: ringSize,
              border: `2px solid ${color}`,
              borderRadius: "50%",
              opacity: 0.22 - index * 0.045,
            }}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 794,
          top: 174,
          display: "flex",
          width: 272,
          height: 272,
          borderRadius: "50%",
          border: "2px solid rgba(226, 242, 194, 0.72)",
          background:
            "radial-gradient(circle at 35% 28%, rgba(245, 252, 224, 0.23), rgba(181, 215, 164, 0.07) 52%, rgba(7, 18, 12, 0.18) 100%)",
          boxShadow:
            "0 0 70px rgba(205, 235, 168, 0.12), inset 0 0 50px rgba(232, 248, 204, 0.08)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 904,
          top: 174,
          display: "flex",
          width: 272,
          height: 272,
          borderRadius: "50%",
          border: "2px solid rgba(226, 242, 194, 0.72)",
          background:
            "radial-gradient(circle at 35% 28%, rgba(245, 252, 224, 0.16), rgba(181, 215, 164, 0.04) 52%, rgba(7, 18, 12, 0.2) 100%)",
          boxShadow:
            "0 0 70px rgba(205, 235, 168, 0.1), inset 0 0 50px rgba(232, 248, 204, 0.07)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 64,
          top: 54,
          display: "flex",
          alignItems: "center",
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: "-1.5px",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            width: 37,
            height: 26,
            marginRight: 11,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              display: "flex",
              width: 25,
              height: 25,
              border: "2px solid #e7eccf",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 12,
              display: "flex",
              width: 25,
              height: 25,
              border: "2px solid #e7eccf",
              borderRadius: "50%",
            }}
          />
        </div>
        lenshift
      </div>

      <div
        style={{
          position: "absolute",
          left: 66,
          top: 208,
          display: "flex",
          flexDirection: "column",
          width: 700,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 23,
            color: "#dff2b8",
            fontSize: 14,
            letterSpacing: "3px",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 7,
              height: 7,
              marginRight: 12,
              borderRadius: "50%",
              background: "#ddf5a7",
              boxShadow: "0 0 16px rgba(221, 245, 167, 0.55)",
            }}
          />
          VISION, SHIFTED.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 500,
            lineHeight: 1,
            letterSpacing: "-5px",
          }}
        >
          Same world.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 4,
            color: "#dff2b8",
            fontFamily: "Georgia, serif",
            fontSize: 76,
            fontStyle: "italic",
            lineHeight: 1,
            letterSpacing: "-5px",
          }}
        >
          Different reality.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 66,
          right: 66,
          bottom: 45,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 18,
          borderTop: "1px solid rgba(226, 238, 211, 0.18)",
          color: "rgba(225, 235, 217, 0.7)",
          fontSize: 14,
          letterSpacing: "1.5px",
        }}
      >
        <div style={{ display: "flex" }}>INTERACTIVE VISION SIMULATOR</div>
        <div style={{ display: "flex", color: "#e8f2d6" }}>
          MYOPIA · HYPEROPIA · ASTIGMATISM
        </div>
      </div>
    </div>,
    size,
  );
}
