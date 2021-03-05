"""cli helper for selecting appropriate <rounds> value for a given hash"""
#=============================================================================
# imports
#=============================================================================
from __future__ import division, print_function
# core
import math
import logging; log = logging.getLogger(__name__)
import sys
# site
# pkg
from passlib.registry import get_crypt_handler
from passlib.utils import tick
# local
__all__ = [
    "main",
]

#=============================================================================
# main
#=============================================================================
_usage = "usage: python choose_rounds.py <hash_name> [<target_milliseconds>] [<backend>]\n"

def main(*args):
    #---------------------------------------------------------------
    # parse args
    #---------------------------------------------------------------
    args = list(args)
    def print_error(msg):
        print("error: %s\n" % msg)

    # parse hasher
    if args:
        name = args.pop(0)
        if name == "-h" or name == "--help":
            print(_usage)
            return 1
        try:
            hasher = get_crypt_handler(name)
        except KeyError:
            print_error("unknown hash %r" % name)
            return 1
        if 'rounds' not in hasher.setting_kwds:
            print_error("%s does not support variable rounds" % name)
            return 1
    else:
        print_error("hash name not specified")
        print(_usage)
        return 1

    # parse target time
    if args:
        try:
            target = int(args.pop(0))*.001
            if target <= 0:
                raise ValueError
        except ValueError:
            print_error("target time must be integer milliseconds > 0")
            return 1
    else:
        target = .350

    # parse backend
    if args:
        backend = args.pop(0)
        if hasattr(hasher, "set_backend"):
            hasher.set_backend(backend)
        else:
            print_error("%s does not support multiple backends")
            return 1

    #---------------------------------------------------------------
    # setup some helper functions
    #---------------------------------------------------------------
    if hasher.rounds_cost == "log2":
        # time cost varies logarithmically with rounds parameter,
        # so speed = (2**rounds) / elapsed
        def rounds_to_cost(rounds):
            return 2 ** rounds
        def cost_to_rounds(cost):
            return math.log(cost, 2)
    else:
        # time cost varies linearly with rounds parameter,
        # so speed = rounds / elapsed
        assert hasher.rounds_cost == "linear"
        rounds_to_cost = cost_to_rounds = lambda value: value

    def clamp_rounds(rounds):
        """convert float rounds to int value, clamped to hasher's limits"""
        if hasher.max_rounds and rounds > hasher.max_rounds:
            rounds = hasher.max_rounds
        rounds = int(rounds)
        if getattr(hasher, "_avoid_even_rounds", False):
            rounds |= 1
        return max(hasher.min_rounds, rounds)

    def average(seq):
        if not hasattr(seq, "__length__"):
            seq = tuple(seq)
        return sum(seq) / len(seq)

    def estimate_speed(rounds):
        """estimate speed using specified # of rounds"""
        # time a single verify() call
        secret = "S0m3-S3Kr1T"
        hash = hasher.using(rounds=rounds).hash(secret)
        def helper():
            start = tick()
            hasher.verify(secret, hash)
            return tick() - start
        # try to get average time over a few samples
        # XXX: way too much variability between sampling runs,
        #      would like to improve this bit
        elapsed = min(average(helper() for _ in range(4)) for _ in range(4))
        return rounds_to_cost(rounds) / elapsed

    #---------------------------------------------------------------
    # get rough estimate of speed using fraction of default_rounds
    # (so we don't take crazy long amounts of time on slow systems)
    #---------------------------------------------------------------
    rounds = clamp_rounds(cost_to_rounds(.5 * rounds_to_cost(hasher.default_rounds)))
    speed = estimate_speed(rounds)

    #---------------------------------------------------------------
    # re-do estimate using previous result,
    # to get more accurate sample using a larger number of rounds.
    #---------------------------------------------------------------
    for _ in range(2):
        rounds = clamp_rounds(cost_to_rounds(speed * target))
        speed = estimate_speed(rounds)

    #---------------------------------------------------------------
    # using final estimate, calc desired number of rounds for target time
    #---------------------------------------------------------------
    if hasattr(hasher, "backends"):
        name = "%s (using %s backend)" % (name, hasher.get_backend())
    print("hash............: %s" % name)
    if speed < 1000:
        speedstr = "%.2f" % speed
    else:
        speedstr = int(speed)
    print("speed...........: %s iterations/second" % speedstr)
    print("target time.....: %d ms" % (target*1000,))
    rounds = cost_to_rounds(speed * target)
    if hasher.rounds_cost == "log2":
        # for log2 rounds parameter, target time will usually fall
        # somewhere between two integer values, which will have large gulf
        # between them. if target is within <tolerance> percent of
        # one of two ends, report it, otherwise list both and let user decide.
        tolerance = .05
        lower = clamp_rounds(rounds)
        upper = clamp_rounds(math.ceil(rounds))
        lower_elapsed = rounds_to_cost(lower) / speed
        upper_elapsed = rounds_to_cost(upper) / speed
        if (target-lower_elapsed)/target < tolerance:
            print("target rounds...: %d" % lower)
        elif (upper_elapsed-target)/target < tolerance:
            print("target rounds...: %d" % upper)
        else:
            faster = (target - lower_elapsed)
            prin("target rounds...: %d (%dms -- %dms/%d%% faster than requested)" % \
                  (lower, lower_elapsed*1000, faster * 1000, round(100 * faster / target)))
            slower = (upper_elapsed - target)
            print("target rounds...: %d (%dms -- %dms/%d%% slower than requested)" % \
                  (upper, upper_elapsed*1000, slower * 1000, round(100 * slower / target)))
    else:
        # for linear rounds parameter, just use nearest integer value
        rounds = clamp_rounds(round(rounds))
        print("target rounds...: %d" % (rounds,))
    print()

if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:]))

#=============================================================================
# eof
#=============================================================================
