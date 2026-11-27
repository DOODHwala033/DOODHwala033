import { Composition, Folder, Still } from "remotion";
import { AiTakeover, AI_TAKEOVER_DURATION } from "./AiTakeover/AiTakeover";
import { aiTakeoverDefaults, aiTakeoverSchema } from "./AiTakeover/schema";
import {
  ALCATRAZ_DURATION,
  ALCATRAZ_FPS,
  AlcatrazIntro,
} from "./AlcatrazIntro/AlcatrazIntro";
import {
  CharacterSheet,
  SHEET_H,
  SHEET_W,
} from "./AlcatrazIntro/CharacterSheet";
import { alcatrazDefaults, alcatrazSchema } from "./AlcatrazIntro/schema";
import { DeepDive, DEEP_DIVE_DURATION } from "./DeepDive/DeepDive";
import { deepDiveDefaults, deepDiveSchema } from "./DeepDive/schema";
import { HelloWorld } from "./HelloWorld";
import { EpTest, epTestSchema } from "./InkMan/ep/Test";
import { Lab, labSchema } from "./EP41/realistic/Lab";
import { WB2Lab, wb2LabSchema } from "./WheelBattle2/Lab";
import {
  WB2_DURATION,
  WB2_FPS,
  WheelBattle2,
  wb2Schema,
} from "./WheelBattle2/Episode";
import {
  EP41,
  EP41_DURATION,
  EP41_FPS,
  EP41_TAIL,
  ep41Schema,
} from "./EP41/Episode";
import {
  BLACK_TAIL,
  EpisodeGojoMakima,
  MAKIMA_DURATION,
  MAKIMA_FPS,
  makimaSchema,
} from "./InkMan/ep/EpisodeGojoMakima";
import {
  SAITAMA_DURATION,
  SAITAMA_FPS,
  SaitamaVsMoon,
  saitamaSchema,
} from "./InkMan/SaitamaVsMoon/SaitamaVsMoon";
import {
  GOJO_VS_SUN_DURATION,
  GOJO_VS_SUN_FPS,
  GojoVsSun,
} from "./InkMan/GojoVsSun/GojoVsSun";
import {
  InkManTurntable,
  InkManView,
  TURNTABLE_DURATION,
  TURNTABLE_FPS,
  turntableSchema,
  viewSchema,
} from "./InkMan/Turntable";
import {
  SUN_DURATION,
  SUN_FPS,
  SunEnvironment,
  SunView,
  sunViewSchema,
} from "./InkMan/SunEnvironment";
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
      <Folder name="InkMan">
        <Composition
          id="InkManTurntable"
          component={InkManTurntable}
          durationInFrames={TURNTABLE_DURATION}
          fps={TURNTABLE_FPS}
          width={1080}
          height={1920}
          schema={turntableSchema}
          defaultProps={{ character: "base" as const }}
        />
        <Still
          id="InkManView"
          component={InkManView}
          width={1080}
          height={1920}
          schema={viewSchema}
          defaultProps={{ view: "front" as const, character: "base" as const }}
        />
        <Composition
          id="GojoVsSun"
          component={GojoVsSun}
          durationInFrames={GOJO_VS_SUN_DURATION}
          fps={GOJO_VS_SUN_FPS}
          width={1080}
          height={1920}
        />
        <Composition
          id="SaitamaVsMoon"
          component={SaitamaVsMoon}
          durationInFrames={SAITAMA_DURATION}
          fps={SAITAMA_FPS}
          width={1080}
          height={1920}
          schema={saitamaSchema}
          defaultProps={{
            voiceFile: "inkman/saitama-vs-moon/voiceover.mp3",
            captionsFile: "inkman/saitama-vs-moon/voiceover.json",
          }}
        />
        <Composition
          id="GojoVsMakima"
          component={EpisodeGojoMakima}
          durationInFrames={MAKIMA_DURATION + BLACK_TAIL}
          fps={MAKIMA_FPS}
          width={1080}
          height={1920}
          schema={makimaSchema}
          defaultProps={{
            voiceFile: "inkman/gojo-vs-makima/voice.mp3",
            captionsFile: "inkman/gojo-vs-makima/voiceover.json",
          }}
        />
        <Composition
          id="WheelBattleEp2"
          component={WheelBattle2}
          durationInFrames={WB2_DURATION}
          fps={WB2_FPS}
          width={1080}
          height={1920}
          schema={wb2Schema}
          defaultProps={{
            audioFile: "wb2/v2/voice.wav",
            captionsFile: "wb2/v2/voiceover.json",
          }}
        />
        <Composition
          id="WB2Lab"
          component={WB2Lab}
          durationInFrames={90}
          fps={30}
          width={1080}
          height={1920}
          schema={wb2LabSchema}
          defaultProps={{ view: "lineup" }}
        />
        <Composition
          id="EP41SukunaShrine"
          component={EP41}
          durationInFrames={EP41_DURATION + EP41_TAIL}
          fps={EP41_FPS}
          width={1080}
          height={1920}
          schema={ep41Schema}
          defaultProps={{
            audioFile: "ep41/voice.mp3",
            captionsFile: "ep41/voiceover.json",
          }}
        />
        <Composition
          id="EP41Lab"
          component={Lab}
          durationInFrames={60}
          fps={30}
          width={1080}
          height={1920}
          schema={labSchema}
          defaultProps={{ view: "wide" }}
        />
        <Still
          id="EpTest"
          component={EpTest}
          width={1080}
          height={1920}
          schema={epTestSchema}
          defaultProps={{ view: "wide" as const }}
        />
        <Composition
          id="SunEnvironment"
          component={SunEnvironment}
          durationInFrames={SUN_DURATION}
          fps={SUN_FPS}
          width={1080}
          height={1920}
        />
        <Still
          id="SunView"
          component={SunView}
          width={1080}
          height={1920}
          schema={sunViewSchema}
          defaultProps={{ view: "horizon" as const }}
        />
      </Folder>
      <Composition
        id="AlcatrazIntro"
        component={AlcatrazIntro}
        durationInFrames={ALCATRAZ_DURATION}
        fps={ALCATRAZ_FPS}
        width={1080}
        height={1920}
        schema={alcatrazSchema}
        defaultProps={alcatrazDefaults}
      />
      <Still
        id="CharacterSheet"
        component={CharacterSheet}
        width={SHEET_W}
        height={SHEET_H}
      />
      <Composition
        id="DeepDive"
        component={DeepDive}
        durationInFrames={DEEP_DIVE_DURATION}
        fps={30}
        width={1080}
        height={1920}
        schema={deepDiveSchema}
        defaultProps={deepDiveDefaults}
      />
    </>
  );
};
