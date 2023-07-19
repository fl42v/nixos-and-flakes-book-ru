# Get Started with NixOS

Разобравшись с основами языка, можем переходить к конфигурации системы. Дефолтный конфиг лежит в `/etc/nixos/configuration.nix`. Там декларируются различные настройки системы вроде часового пояса, языка, раскладки клавиатуры, конфига (бес)проводных сетей, пользователей, используемых/поддерживаемых файловых систем и опции, передаваемые загрузчиоком ядру во время загрузки (kernel cmdline).

Rогда нужно что-то поставить на более-менее постоянной основе, пользователь меняет этот файл и выполняет `sudo nixos-rebuild switch` для применения изменений. This command generates a new system environment based on the modified configuration file, sets the new environment as the default one, and preserves the previous environment in the boot options of grub/systemd-boot. This ensures that we can always roll back to the old environment if the new one fails to start.

While `/etc/nixos/configuration.nix` is the classic method for configuring NixOS, it relies on data sources configured by `nix-channel` and lacks a version-locking mechanism, making it challenging to ensure the reproducibility of the system. A better approach is to use Flakes, which provides reproducibility and facilitates configuration management.

In this section, we will first learn how to manage NixOS using the classic method (`/etc/nixos/configuration.nix`), and then we will explore the more advanced Flakes.

## Configuring the System using `/etc/nixos/configuration.nix`

The `/etc/nixos/configuration.nix` file is the default and classic method for configuring NixOS. While it lacks some of the advanced features of Flakes, it is still widely used and provides flexibility in system configuration.

To illustrate how to use `/etc/nixos/configuration.nix`, let's consider an example where we enable SSH and add a user named `ryan` to the system. We can achieve this by adding the following content to `/etc/nixos/configuration.nix`:

```nix{14-38}
# Edit this configuration file to define what should be installed on
# your system.  Help is available in the configuration.nix(5) man page
# and in the NixOS manual (accessible by running ‘nixos-help’).
{ config, pkgs, ... }:

{
  imports =
    [ # Include the results of the hardware scan.
      ./hardware-configuration.nix
    ];

  # Omit previous configuration settings...

  # Add user 'ryan'
  users.users.ryan = {
    isNormalUser = true;
    description = "ryan";
    extraGroups = [ "networkmanager" "wheel" ];
    openssh.authorizedKeys.keys = [
        # Replace with your own public key
        "ssh-ed25519 <some-public-key> ryan@ryan-pc"
    ];
    packages = with pkgs; [
      firefox
    #  thunderbird
    ];
  };

  # Enable the OpenSSH daemon.
  services.openssh = {
    enable = true;
    settings = {
      X11Forwarding = true;
      PermitRootLogin = "no"; # disable root login
      PasswordAuthentication = false; # disable password login
    };
    openFirewall = true;
  };

  # Omit the rest of the configuration...
}
```

In this configuration, we declare our intention to enable the openssh service, add an SSH public key for the user 'ryan', and disable password login.

To deploy the modified configuration, run `sudo nixos-rebuild switch`. This command will apply the changes, generate a new system environment, and set it as the default. You can now log in to the system using SSH with the configured SSH keys.

Remember that any reproducible changes to the system can be made by modifying the `/etc/nixos/configuration.nix` file and deploying the changes with `sudo nixos-rebuild switch`.

To find configuration options and documentation:

- Use search engines like Google, e.g., search for `Chrome NixOS` to find NixOS-related information about Chrome. The NixOS Wiki and the source code of Nixpkgs are usually among the top results.
- Utilize the [NixOS Options Search](https://search.nixos.org/options) to search for keywords.
- Refer to the [Configuration section](https://nixos.org/manual/nixos/unstable/index.html#ch-configuration) in the NixOS Manual for system-level configuration documentation.
- Search for keywords directly in the source code of [nixpkgs](https://github.com/NixOS/nixpkgs) on GitHub.

## References

- [Overview of the NixOS Linux distribution](https://nixos.wiki/wiki/Overview_of_the_NixOS_Linux_distribution)
