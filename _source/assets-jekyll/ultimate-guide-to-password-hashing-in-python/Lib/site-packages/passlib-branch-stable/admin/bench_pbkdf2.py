"""
helper script to benchmark pbkdf2 implementations/backends
"""
#=============================================================================
# init script env
#=============================================================================
from __future__ import absolute_import, division, print_function, unicode_literals

# make sure passlib source dir is first in import path
import os, sys
os.chdir(os.path.abspath(os.path.join(__file__, *[".."]*2)))
sys.path.insert(0, "")

#=============================================================================
# imports
#=============================================================================
# core
from timeit import Timer
try:
    from importlib import reload  # py34+
except ImportError:
    try:
        from imp import reload  # py30-33
    except ImportError:
        assert reload, "expected builtin reload()"  # py2x
# site
# pkg
from passlib.utils.compat import PY3
# local

#=============================================================================
# main
#=============================================================================
def main():

    #--------------------------------------------------------------
    # config
    #--------------------------------------------------------------
    bestof = 3
    number = 60 // bestof

    algs = ["sha1", "sha256", "sha512", "md4"]
    rounds = 10**4
    secret = b"password"
    salt = b"salt"

    #--------------------------------------------------------------
    # formatting
    #--------------------------------------------------------------
    header = "{0:14s} {1:1s}"
    cell = "{0:>10s} "
    num_cell = "{0:>10d} "
    div = "-" * (len(cell.format(""))-1) + " "

    units_per_sec = 1000
    print(header.format("(rounds/ms)", "") + "".join(cell.format(alg) for alg in algs))
    print(header.format("", "") + div * len(algs))

    #--------------------------------------------------------------
    # harness
    #--------------------------------------------------------------
    def timeit(stmt, setup):
        return min(Timer(stmt, setup).repeat(bestof, number)) / number

    def benchmark(name, setup, stmt, supported=True):
        print(header.format(name, "|"), end="")
        sys.stdout.flush()
        for alg in algs:
            alg_stmt = stmt.format(alg=alg, secret=secret, salt=salt, rounds=rounds)
            if supported is not True and alg not in supported:
                try:
                    timeit(alg_stmt, setup)
                except Exception as err:
                    # expected to fail
                    print(cell.format("-"), end="")
                    continue
                else:
                    raise AssertionError("expected %r / %r to fail" % (name, alg))
            rounds_per_sec = rounds / timeit(alg_stmt, setup)
            print(num_cell.format(int(rounds_per_sec / units_per_sec)), end="")
            sys.stdout.flush()
        print()

    def na(name):
        print(header.format(name, "|") + cell.format("-") * len(algs))

    #--------------------------------------------------------------
    # test fastpbkdf2
    #--------------------------------------------------------------
    try:
        from fastpbkdf2 import algorithm
    except ImportError:
        algorithm = None
    if algorithm:
        benchmark("fastpbkdf2",
                  "from fastpbkdf2 import pbkdf2_hmac",
                  "pbkdf2_hmac({alg!r}, {secret!r}, {salt!r}, {rounds})",
                  supported=list(algorithm))
    else:
        na("fastpbkdf2")

    #--------------------------------------------------------------
    # test hashlib
    #--------------------------------------------------------------
    try:
        from hashlib import pbkdf2_hmac
        if pbkdf2_hmac.__module__ == "_hashlib":
            backend = "ssl"
        else:
            assert pbkdf2_hmac.__module__ == "hashlib"
            backend = "py"
    except ImportError:
        backend = None

    if backend:
        benchmark("hashlib/%s" % backend,
                  "from hashlib import pbkdf2_hmac",
                  "pbkdf2_hmac({alg!r}, {secret!r}, {salt!r}, {rounds})")
    else:
        na("hashlib")

    #--------------------------------------------------------------
    # test passlib backends
    #--------------------------------------------------------------

    import passlib.crypto.digest as digest_mod
    for backend in ["from-bytes", "unpack", "hexlify"]:
        name = "p/%s" % backend
        if backend == "from-bytes" and not PY3:
            na(name)
            continue
        os.environ['PASSLIB_PBKDF2_BACKEND'] = backend
        reload(digest_mod)
        benchmark(name,
                  "from passlib.crypto.digest import pbkdf2_hmac",
                  "pbkdf2_hmac({alg!r}, {secret!r}, {salt!r}, {rounds})")

    os.environ["PASSLIB_PBKDF2_BACKEND"] = ""
    reload(digest_mod)
    print("\nactive backends: ", digest_mod.PBKDF2_BACKENDS.replace(",", ", "))

    #--------------------------------------------------------------
    # done
    #--------------------------------------------------------------

if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:]))

#=============================================================================
# eoc
#=============================================================================

