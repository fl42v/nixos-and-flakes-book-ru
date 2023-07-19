# Introduction to Flakes

Флейки (flakes) - экспериментальная фича Nix-а, предоставляющая в первую очередь возможность следить за версиями внешних зависимостей никсовых выражений, что сильно повышает повторяемость, да и в целом юзабельность системы.

Однако проще объяснить на примере: предположим, пользователь разворачивает NixOS на двух машинах с промежутком в несколько дней. Без флейков возможна ситуация, когда за эти несколько дней какая-то часть софта в репозиториях обновляется, и системы уже нельзя назвать идентичными. Однако с ними "версии репозиториев" фиксируются в `flake.lock`-файле и такой проблемы не происходит. Для знакомых с git, в упомянутом файле лежит информация о репозиториях (имя, хозяин, ревизия, хэши и т.п.), в которых хранятся nix expressions, которые собирают софт.

Кстати говоря, несмотря на то, что фича считается экспериментальной, ее использует едва ли не большая часть сообщества.[^3]

## Флейки и классический Nix

Из-за того, что фичи `nix-command` и `flakes` не стабилизированы, документация по ним лежит в разделе "нутакое". Классический же nix далеко не так удобен, поэтому на него в контексте предлагается забить и сразу перейти к использования `nix-command` и `flakes`.

После включения этих фич, следующие комманды перестают быть актуальными, так что их стоит игнорировать (и, возможно, они уйдут):

1. `nix-channel`: штука, подобно классическим пакетникам использующая стабильные/нестабильные/тестовые каналы для менеджмента версий софта.
   1. При использовании флейков нужные каналы прописываются в секции `inputs` файла `flake.nix`.
2. `nix-env`: использует каналы (сконфиженные черз `nix-channel`) для установки софта запустившего ее пользователя (в противовес системной установке). Установленный через нее софт автоматически не пишется в системный конфиг.
   1. Заменен на `nix profile`, но и он идет в разрез с идеями повторяемости, соответственно не рекоммендуем к использованию.
3. `nix-shell`: создает шелл с доступом к какому-либо софту, что полезно, например, для разработки и тестирования.
   1. Разделен на 3 команды, `nix develop`, `nix shell` и `nix run`. Разберем их в главе про [Разработку](../development/intro.md).
4. `nix-build`: собирает пакет и закидывает результат сборки в `/nix/store`, однако не записывает ничего в системный конфиг.
   1. Заменен на `nix build`.
5. `nix-collect-garbage`: удаляет более не используемые объекты в `/nix/store`.
   1. Заменен на `nix store gc --debug`.
6. Ряд других не так часто встречающихся команд можно найти в статье [Try to explain nix commands](https://qiita.com/Sumi-Sumi/items/6de9ee7aab10bc0dbead?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en).

> Примечание: `nix-env -qa` все еще может быть полезен, т.к. возвращает список всех установленных в систему пакетов.

## When Will Flakes Be Stabilized?

I delved into some details regarding Flakes:

- [[RFC 0136] A Plan to Stabilize Flakes and the New CLI Incrementally](https://github.com/NixOS/rfcs/pull/136): A plan to incrementally stabilize Flakes and the new CLI, still a work in progress.
- [Why Are Flakes Still Experimental? - NixOS Discourse](https://discourse.nixos.org/t/why-are-flakes-still-experimental/29317): A post discussing why Flakes are still considered experimental.
- [Flakes Are Such an Obviously Good Thing - Graham Christensen](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/): An article emphasizing the advantages of Flakes while suggesting areas for improvement in its design and development process.
- [Draft: 1-year Roadmap - NixOS Foundation](https://nixos-foundation.notion.site/1-year-roadmap-0dc5c2ec265a477ea65c549cd5e568a9): A roadmap provided by the NixOS Foundation, which includes plans regarding the stabilization of Flakes.

After reviewing these resources, it seems likely that Flakes will be stabilized within one or two years, possibly accompanied by some breaking changes.

[^1]: [Flakes - NixOS Wiki](https://nixos.wiki/index.php?title=Flakes)
[^2]: [Flakes are such an obviously good thing](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/)
[^3]: [Draft: 1 year roadmap - NixOS Foundation](https://nixos-foundation.notion.site/1-year-roadmap-0dc5c2ec265a477ea65c549cd5e568a9)
