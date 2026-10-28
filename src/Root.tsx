import { Composition, Folder } from "remotion";
import { AiTakeover, AI_TAKEOVER_DURATION } from "./AiTakeover/AiTakeover";
import { aiTakeoverDefaults, aiTakeoverSchema } from "./AiTakeover/schema";
import { HelloWorld } from "./HelloWorld";
import { Motion3D, MOTION_3D_DURATION } from "./Motion3D/Motion3D";
import { motion3DDefaults, motion3DSchema } from "./Motion3D/schema";
import { Logo } from "./HelloWorld/Logo";
import { Title } from "./HelloWorld/Title";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Elements">
        <Composition
          id="Logo"
          component={Logo}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            logoColor1: "#91EAE4",
            logoColor2: "#86A8E7",
          }}
        />
        <Composition
          id="Title"
          component={Title}
          durationInFrames={115}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            titleText: "Welcome to Remotion",
            titleColor: "#000000",
          }}
        />
      </Folder>
      <Composition
        // You can take the "id" to render a video:
        // bunx remotion render HelloWorld
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
        }}
      />
      <Composition
        id="AiTakeover"
        component={AiTakeover}
        durationInFrames={AI_TAKEOVER_DURATION}
        fps={30}
        width={1080}
        height={1920}
        schema={aiTakeoverSchema}
        defaultProps={aiTakeoverDefaults}
      />
      <Composition
        id="Motion3D"
        component={Motion3D}
        durationInFrames={MOTION_3D_DURATION}
        fps={30}
        width={1920}
        height={1080}
        schema={motion3DSchema}
        defaultProps={motion3DDefaults}
      />
    </>
  );
};
