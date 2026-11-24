<picture>
	<source media="(prefers-color-scheme: light)" srcset=".github/assets/banner-light.webp">
	<img alt="Lepse Cover" src=".github/assets/banner-dark.webp">
</picture>

<h1 align="center">Lepse <i>(/lɛps/)</i></h1>

<div align="center">
  <a href="https://flathub.org/apps/app.lepse.Lepse">
    <picture>
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/flathub/v/app.lepse.Lepse?color=0f2d1d&style=for-the-badge">
      <img alt="Flathub" src="https://img.shields.io/flathub/v/app.lepse.Lepse?color=d3efdf&style=for-the-badge">
    </picture>
  </a>
</div>

<br />

<p align="center"><i>Your</i>&nbsp;<b>Personal focus companion</b><p>

<!-- TODO: Screenshot in GIF -->
<img src="https://cdn.lepse.app/lachesis-app-screenshots/lepse-home.png" />

Lepse is a minimal and aesthetic productivity tool designed to make being productive simpler, more enjoyable, and easier, with a pomodoro timer, a relaxing clock, and lounges to study together with friends.

> I've tried other apps, but I always got overwhelmed, so I created Lepse. (ps. During breaks, I always found myself staring at a clock, shout-out [relaxingclock](https://relaxingclock-com.netlify.app/))

Instead of creating tasks and then completing them in a mindless loop, link tasks to the goals they enable so that each task actually means something. Start a Pomodoro timer or stopwatch on any task, and every second is tracked to that task, so you can see how much time you've spent on it.

Not focusing, or just needing rest? Let the clock keep you company.

## Lepse Monorepo

Welcome to the monorepo! All components that enable Lepse to work how it does are in here!

If you're not a developer and/or are looking for the main page, [here](https://lepse.app) it is.

# Installation

If you've somehow stumbled here, it is recommended to download Lepse from the [homepage](https://lepse.app). Downloads are also available in the [latest release](https://github.com/lepsehq/lepse/releases/latest).

<!-- TODO: app to AUR and show that -->

> [!NOTE]
> More is coming :> ps. I'm open to feedback. (options to contact me are on my GitHub profile)

## Roadmap

- [x] **Goals** - goals, not associated with time, so things like projects, hobbies, etc. (tasks are for deadlines and work sessions).
- [x] **Tasks** - any task, or _optionally_ connected to a goal (u could think of it as goals broken down into tasks).
- [ ] **Habits** - habits that can recur daily or only on certain days. **(archived for now)**
- [ ] **Day lifecycle** - a day is a day, for score counting and journal mapping. **(archived for now)**
- [x] **Focus screen** - AFK screen (clock), or pomo/stopwatch for work sessions, which can connect to a specific task to track time on said task.
- [ ] **Journal & Scribbles** - journals are for daily reflection; scribbles are for random notes not connected to a specific day. **(archived for now)**
- [ ] **Calendar** - week/month overview of your days (tasks, mood, score, habits). **(archived for now)**
- [ ] **Notifications** - reminders for start of day, end of day, habit reminders, and Pomodoro cycles. **(archived for now, except the pomo updates prolly)**
- [x] **Desktop app** - desktop app via Tauri (a single dev **cannot** do native apps) _(not me at least)_.
- [ ] **Pets** - tba.
- [ ] **Friends** - friends + lobby sessions (invite-only, not public lobbies)

## Development

> more _"documentation"_ of the codebase can be found in the [deepwiki](https://deepwiki.com/lepsehq/lepse).

This monorepo contains multiple projects. There is more detailed information in each of their READMEs about their own development:

| Project     | Directory       |
| ----------- | --------------- |
| Website     | `apps/atropos`  |
| App         | `apps/lachesis` |
| Backend/API | `apps/clotho`   |

Shared libraries live in `packages/`. Scripts live in `scripts/` and are preferably written in NodeJS.

### Contributing

All contributions are very much appreciated! Before submitting one, please read the [contributing guidelines](CONTRIBUTING.md).

If you want to fork this repository for your own purposes, please read the [copying guidelines](COPYING.md).

## License

All packages in this repository are licensed under their respective licenses. Refer to the [copying guidelines](COPYING.md) for more information, including the use of the Lepse name and branding.
