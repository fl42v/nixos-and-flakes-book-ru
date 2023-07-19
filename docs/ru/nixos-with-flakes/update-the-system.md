# Updating the System

Обновляться достаточно просто: 

```shell
# Обновляем flake.lock
nix flake update path/to/directory/with/the/flake

# Ставим новые пакеты
sudo nixos-rebuild switch --flake path/to/directory/with/the/flake

```

Время от времени при ребилде без обновления могут падать ошибки вида "sha256 mismatch", они фиксятся обновлением `flake.lock`-а через `nix flake update`.
