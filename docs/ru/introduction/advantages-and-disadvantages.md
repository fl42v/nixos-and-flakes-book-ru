# Плюсы и минусы NixOS

## Плюсы

- **Декларативная конфигурация, OS как код**
  - Состояние всей системы описывается в одном конфиге, который можно залить в систему контроля версий, вроде git, что в свою очередь позволит откатить никсось к +/- любому моменту ее существования.
  - Flakes (флейки) еще сильнее прокачивают повторяемость благодаря использования `flake.lock`-файла, which records the data source addresses, hash values, and other relevant information for all dependencies. This design greatly improves Nix's reproducibility and ensures consistent build results. It draws inspiration from package management designs in programming languages like Cargo and NPM.
- **Удобно кастомизируется**
  - Всего за пару строк конфига можно менять и настраивать целые компоненты системы. Nix при этом делает всю тажелую работу.
  - Modifications are safe and switching between different desktop environments (such as GNOME, KDE, i3, and sway) is straightforward, with minimal pitfalls.
- **Возможность быстро откатить систему к предыдущему состоянию**
  - Если что-то ломается по вине разработчика или пользователя, всегда можно вернуться к предыдущему состоянию системы, при этом если операционка не загружается, его можно выбрать в загрузчике. Как следстсвие, nixos можно считать одной из самых стабильных ОС.
- **Никаких конфликтующих зависимостей**
  - Когда nix ставит пакет, последний ложится в отдельную директорию в `/nix/store`. В имя этой директории включен хэш пакета, что позволяет безболезненно устанавливать различные версии одних и тех же программ/библиотек.
- **Активное сообщество с кучей сторонних проектов**
  - The official package repository, nixpkgs, has numerous contributors, and many people share their Nix configurations. Exploring the NixOS ecosystem is an exciting experience, akin to discovering a new continent.

<figure>
  <img src="/nixos-bootloader.avif">
  <figcaption>
    <h4 align="center">
      All historical versions are listed in the boot options of NixOS. <br>
      Image from
      <a href="https://discourse.nixos.org/t/how-to-make-uefis-grub2-menu-the-same-as-bioss-one/10074" target="_blank" rel="noopener noreferrer">
        NixOS Discourse - 10074
      </a>
    </h4>
  </figcaption>
</figure>

## Минусы

- **Сложности в освоении**:
  - Achieving complete reproducibility and avoiding pitfalls associated with improper usage requires learning about Nix's entire design and managing the system declaratively, rather than blindly using commands like `nix-env -i` (similar to `apt-get install`).
- **Такая себе документация**:
  - Currently, Nix Flakes remains an experimental feature, and there is limited documentation specifically focused on it. Most Nix community documentation primarily covers the older `nix-env`/`nix-channel` approach. If you want to start learning directly from Nix Flakes, you need to refer to a significant amount of outdated documentation and extract the relevant information. Additionally, some core features of Nix, such as `imports` and the Nix Module System, lack detailed official documentation, requiring resorting to source code analysis.
- **Занимает больше места на диске**:
  - To ensure the ability to roll back the system at any time, Nix retains all historical environments by default, resulting in increased disk space usage.
  - While this additional space usage may not be a concern on desktop computers, it can become problematic on resource-constrained cloud servers.
- **Малопонятные сообщения об ошибках**:
  - Чаще всего проблем с этим не возникает, но время от времени в сообщении не говорится о конкретной ошибке, а запуск с предложенной там опцией `--show-trace` выдает стену текста (собственно, stack trace), разбираться в которой долго и муторно.
  - Two potential reasons for this problem are: (1) Nix is a dynamically-typed language, and various parameters are determined at runtime, and (2) error handling logic in the used flake packages may be inadequate, resulting in unclear error messages. Some obscure errors may not even be traceable through error stacks.
- **More Complex Underlying Implementation**:
  - Nix's declarative abstraction introduces additional complexity in the underlying code compared to similar code in traditional imperative tools.
  - This complexity increases implementation difficulty and makes it more challenging to make custom modifications at the lower level. However, this burden primarily falls on Nix package maintainers, as regular users have limited exposure to the underlying complexities, reducing their burden.

## Summary

Overall, I believe that NixOS is suitable for developers with a certain level of Linux usage experience and programming knowledge who desire greater control over their systems.

I do not recommend newcomers without any Linux usage experience to dive directly into NixOS, as it may lead to a frustrating journey.

> If you have more questions about NixOS, you can refer to the last chapter of this book, [FAQ](../faq/).
